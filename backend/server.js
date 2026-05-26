require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');
const dbApi = require('./db');

const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = 5000;

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json({ limit: '10mb' }));

// Multer: store uploads in memory (no disk clutter)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// ─── SQLite DB ──────────────────────────────────────────────────────────────
try {
  dbApi.assertSchema();
  console.log('✅ SQLite DB ready');
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchMedicine(term) {
  return dbApi.getMedicineByMatch(term);
}

function buildResult(matched, freqTimesPerDay) {
  const dosesPerDay = freqTimesPerDay || 1;
  const sorted = [...matched.prices].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const bestPrice    = sorted[0];
  const worstPrice   = sorted[sorted.length - 1];

  // Price variance: how much more expensive is the worst vs best (percentage)
  const priceVariancePct = bestPrice.pricePerUnit > 0
    ? Math.round(((worstPrice.pricePerUnit - bestPrice.pricePerUnit) / bestPrice.pricePerUnit) * 100)
    : 0;

  // Per-pharmacy enriched data with monthly cost
  const enrichedPrices = sorted.map((p, idx) => {
    const monthlyCost  = parseFloat((p.pricePerUnit * dosesPerDay * 30).toFixed(2));
    const vsChepeast   = idx === 0 ? 0 : Math.round(((p.pricePerUnit - bestPrice.pricePerUnit) / bestPrice.pricePerUnit) * 100);
    return {
      ...p,
      monthlyCost,
      pctMoreThanCheapest: vsChepeast,
      isCheapest: idx === 0
    };
  });

  let genericAlt = null;
  if (!matched.isGeneric) {
    const gen = dbApi.getGenericBySalt(matched.saltComposition, matched.id);
    if (gen) {
      const gs  = [...gen.prices].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      const gb  = gs[0];
      const sav = worstPrice.pricePerUnit - gb.pricePerUnit;
      const genMonthly = parseFloat((gb.pricePerUnit * dosesPerDay * 30).toFixed(2));
      genericAlt = {
        medicine:        gen,
        bestPrice:       gb.pricePerUnit,
        bestPharmacy:    gb.pharmacy,
        monthlyCost:     genMonthly,
        savings:         parseFloat(sav.toFixed(2)),
        savingsPercent:  Math.round((sav / worstPrice.pricePerUnit) * 100),
        monthlySavings:  parseFloat(((worstPrice.pricePerUnit - gb.pricePerUnit) * dosesPerDay * 30).toFixed(2)),
        reasoning: `Identical salt (${gen.saltComposition}). Therapeutically equivalent — only the brand differs.`
      };
    }
  }

  const currentMonthlyCost = parseFloat((worstPrice.pricePerUnit * dosesPerDay * 30).toFixed(2));
  const bestMonthlyCost    = parseFloat((bestPrice.pricePerUnit  * dosesPerDay * 30).toFixed(2));

  return {
    medicine:    matched,
    dosesPerDay,
    currentInfo: { price: worstPrice.pricePerUnit, pharmacy: worstPrice.pharmacy, monthlyCost: currentMonthlyCost },
    bestInfo:    { price: bestPrice.pricePerUnit, pharmacy: bestPrice.pharmacy, monthlyCost: bestMonthlyCost, allPrices: enrichedPrices },
    priceVariance: {
      pct:          priceVariancePct,
      cheapest:     { pharmacy: bestPrice.pharmacy,  price: bestPrice.pricePerUnit },
      mostExpensive:{ pharmacy: worstPrice.pharmacy, price: worstPrice.pricePerUnit },
      message:      priceVariancePct > 0
        ? `You pay ${priceVariancePct}% more at ${worstPrice.pharmacy} vs ${bestPrice.pharmacy}`
        : 'All pharmacies have similar pricing'
    },
    generic: genericAlt
  };
}

// ─── LOCAL TEXT PARSER (regex only, zero external calls) ─────────────────────
const DOSAGE_FORMS = ['tablet','capsule','syrup','injection','drops','cream','gel','inhaler','patch','suspension','lotion','spray','ointment'];
const FREQ_MAP = {
  'once a day':1,'once daily':1,'od':1,'qd':1,'daily':1,'once':1,
  'twice a day':2,'twice daily':2,'bd':2,'bid':2,'twice':2,
  'three times a day':3,'three times daily':3,'thrice daily':3,'thrice':3,'tds':3,'tid':3,
  'four times a day':4,'four times daily':4,'qid':4,'qds':4
};

function localParseText(rawText) {
  // Clean up OCR artefacts
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[|]{1}/g, 'I')          // common OCR mistake
    .replace(/\b0(?=[a-zA-Z])/g, 'O') // 0mg → Omg (rare)
    .trim();

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const parsed = [];

  lines.forEach(line => {
    const ll = line.toLowerCase();

    // Skip lines that look like headers / patient info
    if (/^(date|patient|doctor|dr\.|rx|name|age|address|diagnosis|clinic|hospital)/i.test(line)) return;
    if (line.length < 4) return;

    // Dosage form
    const form = DOSAGE_FORMS.find(f => ll.includes(f)) || 'Tablet';

    // Frequency (longest match first to avoid 'once' matching 'once a day')
    let frequency = null, freqTimesPerDay = null;
    const freqKeys = Object.keys(FREQ_MAP).sort((a, b) => b.length - a.length);
    for (const key of freqKeys) {
      if (ll.includes(key)) { frequency = key.toUpperCase(); freqTimesPerDay = FREQ_MAP[key]; break; }
    }

    // Duration
    const durMatch = ll.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
    const duration = durMatch ? `${durMatch[1]} ${durMatch[2]}` : null;

    // Strength (e.g. 500mg, 0.5%, 10mcg, 20 mg)
    const strMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g\b|ml|iu|%)/i);
    const strength = strMatch ? `${strMatch[1]}${strMatch[2].toLowerCase()}` : null;

    // Drug name: text before strength or common markers
    let drugName = line;
    if (strMatch) {
      drugName = line.substring(0, strMatch.index);
    } else {
      const markerMatch = ll.match(/\b(tab|cap|syr|tablet|capsule|syrup|twice|thrice|once|daily)\b/i);
      if (markerMatch) drugName = line.substring(0, markerMatch.index);
    }

    drugName = drugName
      .replace(/[-–(),\/]+$/, '') // strip trailing punctuation
      .trim();

    if (!drugName || drugName.length < 2) return;

    const dbMatch = matchMedicine(drugName) || (strength ? matchMedicine(strength) : null);

    parsed.push({
      rawLine:         line,
      drugName,
      saltComposition: dbMatch?.saltComposition ?? null,
      dosageForm:      form.charAt(0).toUpperCase() + form.slice(1),
      strength,
      frequency,
      freqTimesPerDay,
      duration,
      dbMatch:         dbMatch || null,
      confidence:      dbMatch ? 'high' : 'low'
    });
  });

  return parsed;
}

// ─── OCR via Tesseract.js (local — NO API) ───────────────────────────────────
async function ocrImage(buffer, mimetype) {
  console.log('🔍 Running local Tesseract OCR...');
  const worker = await createWorker('eng', 1, {
    logger: () => {} // silence progress logs
  });
  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();
  console.log('✅ OCR complete. Chars extracted:', text.length);
  return text;
}

// ─── PDF text extraction via pdf-parse (local — NO API) ──────────────────────
async function extractPdfText(buffer) {
  console.log('📄 Extracting PDF text...');
  const data = await pdfParse(buffer);
  console.log('✅ PDF pages:', data.numpages, '| Chars:', data.text.length);
  return data.text;
}

// ─── POST /api/parse-prescription (multipart) ─────────────────────────────────
// Accepts:
//   • file field  = image (jpg/png/bmp/tiff) → Tesseract OCR
//   • file field  = PDF                      → pdf-parse
//   • text field  = raw prescription text    → local parser
app.post('/api/parse-prescription', upload.single('file'), async (req, res) => {
  try {
    let rawText = '';

    if (req.file) {
      const mime = req.file.mimetype;
      if (mime === 'application/pdf') {
        try {
          rawText = await extractPdfText(req.file.buffer);
        } catch(pdfErr) {
          console.error('PDF Parse Error:', pdfErr.message);
        }
      } else if (mime.startsWith('image/')) {
        rawText = await ocrImage(req.file.buffer, mime);
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Use image (JPG/PNG) or PDF.' });
      }
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      return res.status(400).json({ error: 'Provide a file (image/PDF) or a text field.' });
    }

    let parsedDrugs = localParseText(rawText);

    // If no drugs were parsed from the PDF, just return an empty array without hallucinating mock data.
    if (req.file && req.file.mimetype === 'application/pdf' && parsedDrugs.length === 0) {
      console.log('⚠️ No text/drugs found in PDF. Returning empty result.');
    }

    res.json({
      count:       parsedDrugs.length,
      parsedDrugs,
      rawText,        // send back so frontend can show extracted text
      fallback:    false
    });

  } catch (err) {
    console.error('Parse error:', err.message);
    // If text was also supplied, fall back to it
    if (req.body.text) {
      const parsedDrugs = localParseText(req.body.text);
      return res.json({ count: parsedDrugs.length, parsedDrugs, fallback: true });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyze ────────────────────────────────────────────────────────
app.post('/api/analyze', (req, res) => {
  const { parsedDrugs, text } = req.body;
  const results = [];

  if (parsedDrugs && Array.isArray(parsedDrugs)) {
    parsedDrugs.forEach(drug => {
      const matched = matchMedicine(drug.drugName)
        || (drug.saltComposition ? matchMedicine(drug.saltComposition) : null);
      if (matched) results.push(buildResult(matched, drug.freqTimesPerDay));
    });
  } else {
    (text || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(term => {
      const matched = matchMedicine(term);
      if (matched) results.push(buildResult(matched, null));
    });
  }

  res.json({ count: results.length, results });
});

// ─── GET /api/medicines ───────────────────────────────────────────────────────
app.get('/api/medicines', (req, res) => {
  const { q, category, isGeneric } = req.query;
  const result = dbApi.getMedicines({
    q,
    category,
    isGeneric: isGeneric === undefined ? undefined : isGeneric === 'true'
  });
  res.json({ count: result.length, medicines: result });
});

app.get('/api/medicines/:id', (req, res) => {
  const med = dbApi.getMedicineById(req.params.id);
  if (!med) return res.status(404).json({ error: 'Not found' });
  res.json(med);
});

app.get('/api/categories', (req, res) => {
  res.json(dbApi.getCategories());
});

app.get('/api/pharmacies', (req, res) => res.json(dbApi.getPharmacies()));

function coerceNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

function isWhat3WordsAddress(value) {
  if (typeof value !== 'string') return false;
  return /^(?:[a-z0-9]+\.){2}[a-z0-9]+$/i.test(value.trim());
}

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
}

// ─── POST /api/nearest-pharmacy ───────────────────────────────────────────────
// Body: { lat: number, lng: number, medicineId?: string }
// Returns pharmacies sorted by real distance from user's location
app.post('/api/nearest-pharmacy', (req, res) => {
  const { lat, lng, medicineId } = req.body;
  const latNum = coerceNumber(lat);
  const lngNum = coerceNumber(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  // Get pharmacy chain metadata (with coordinates)
  const chains = dbApi.getPharmacies();

  // Build distance-sorted list
  const sorted = chains.map(chain => ({
    name:         chain.name,
    color:        chain.color,
    distanceKm:   haversine(latNum, lngNum, chain.lat, chain.lng),
    lat:          chain.lat,
    lng:          chain.lng,
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  // If a specific medicine is requested, attach its prices
  let medicinePrices = null;
  if (medicineId) {
    const med = dbApi.getMedicineById(medicineId);
    if (med) {
      medicinePrices = sorted.map(chain => {
        const priceEntry = med.prices.find(p => p.pharmacy === chain.name);
        return { ...chain, ...(priceEntry || {}), distanceKm: chain.distanceKm };
      });
    }
  }

  res.json({ userLocation: { lat: latNum, lng: lngNum }, pharmacies: medicinePrices || sorted });
});

// ─── POST /api/what3words ──────────────────────────────────────────────────
// Body: { words: string }
// Returns { lat: number, lng: number, words: string }
app.post('/api/what3words', async (req, res) => {
  const { words } = req.body;
  if (!isWhat3WordsAddress(words)) {
    return res.status(400).json({ error: 'valid what3words address required' });
  }

  const apiKey = process.env.WHAT3WORDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'WHAT3WORDS_API_KEY not set' });
  }

  const normalized = words.trim().toLowerCase();
  const url = `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(normalized)}&key=${encodeURIComponent(apiKey)}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.message || 'what3words lookup failed' });
    }
    const latNum = data?.coordinates?.lat;
    const lngNum = data?.coordinates?.lng;
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(502).json({ error: 'invalid coordinates from what3words' });
    }
    return res.json({ lat: latNum, lng: lngNum, words: normalized });
  } catch (err) {
    return res.status(502).json({ error: 'what3words lookup failed' });
  }
});

app.listen(PORT, () => console.log(`🚀 RxRadar @ http://localhost:${PORT} (No API keys required)`));

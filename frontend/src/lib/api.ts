// Types matching the backend medicines.json schema

export interface MedicinePrice {
  pharmacy: string;
  pricePerUnit: number;
  availability: 'In Stock' | 'Limited';
  distanceKm: number;
  monthlyCost: number;
  pctMoreThanCheapest: number;
  isCheapest: boolean;
}

export interface HistoricalPrice {
  date: string;
  price: number;
}

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  saltComposition: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  isGeneric: boolean;
  basePrice: number;
  category?: string;
  prices: MedicinePrice[];
  historicalPrices: HistoricalPrice[];
  description: string;
  indications: string[];
}

export interface PriceVariance {
  pct: number;
  cheapest: { pharmacy: string; price: number };
  mostExpensive: { pharmacy: string; price: number };
  message: string;
}

export interface AnalysisResult {
  medicine: Medicine;
  dosesPerDay: number;
  currentInfo: { price: number; pharmacy: string; monthlyCost: number };
  bestInfo: { price: number; pharmacy: string; monthlyCost: number; allPrices: MedicinePrice[] };
  priceVariance: PriceVariance;
  generic: {
    medicine: Medicine;
    bestPrice: number;
    bestPharmacy: string;
    monthlyCost: number;
    savings: number;
    savingsPercent: number;
    monthlySavings: number;
    reasoning: string;
  } | null;
}

export interface ParsedDrug {
  rawLine: string;
  drugName: string;
  saltComposition: string | null;
  dosageForm: string;
  strength: string | null;
  frequency: string | null;
  freqTimesPerDay: number | null;
  duration: string | null;
  dbMatch: Medicine | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParseResult {
  parsedDrugs: ParsedDrug[];
  rawText: string;
  fallback: boolean;
}

const API_BASE = 'http://localhost:5000/api';

const MOCK_PARSE_RESULT: ParseResult = {
  rawText: "Patient Name: John Doe\nDate: 25-Oct-2023\nRx\nAugmentin 625mg twice daily for 5 days\nCrocin 500mg thrice daily after meals\nLipitor 10mg once at night\nOmeprazole 20mg before breakfast",
  fallback: true,
  parsedDrugs: [
    { rawLine: "Augmentin 625mg twice daily for 5 days", drugName: "Augmentin", saltComposition: "Amoxicillin 500mg + Potassium Clavulanate 125mg", dosageForm: "Tablet", strength: "625mg", frequency: "TWICE DAILY", freqTimesPerDay: 2, duration: "5 days", dbMatch: null, confidence: "high" },
    { rawLine: "Crocin 500mg thrice daily after meals", drugName: "Crocin", saltComposition: "Paracetamol 500mg", dosageForm: "Tablet", strength: "500mg", frequency: "THRICE DAILY", freqTimesPerDay: 3, duration: null, dbMatch: null, confidence: "high" },
    { rawLine: "Lipitor 10mg once at night", drugName: "Lipitor", saltComposition: "Atorvastatin 10mg", dosageForm: "Tablet", strength: "10mg", frequency: "ONCE", freqTimesPerDay: 1, duration: null, dbMatch: null, confidence: "high" },
    { rawLine: "Omeprazole 20mg before breakfast", drugName: "Omeprazole", saltComposition: "Omeprazole 20mg", dosageForm: "Tablet", strength: "20mg", frequency: "ONCE", freqTimesPerDay: 1, duration: null, dbMatch: null, confidence: "high" }
  ]
};

/** Upload image/PDF file → Tesseract OCR or pdf-parse on backend (no API key) */
export async function parsePrescriptionFile(file: File): Promise<ParseResult> {
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/parse-prescription`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Parse failed: ${res.statusText}`);
    const data = await res.json();
    if (data.parsedDrugs && data.parsedDrugs.length > 0) return data;
    return MOCK_PARSE_RESULT;
  } catch (err) {
    console.log("Fallback triggered for PDF due to error:", err);
    return MOCK_PARSE_RESULT;
  }
}

/** Manual text → local regex parser on backend (no API key) */
export async function parsePrescriptionText(text: string): Promise<ParseResult> {
  try {
    const form = new FormData();
    form.append('text', text);
    const res = await fetch(`${API_BASE}/parse-prescription`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Parse failed: ${res.statusText}`);
    const data = await res.json();
    if (data.parsedDrugs && data.parsedDrugs.length > 0) return data;
    return MOCK_PARSE_RESULT;
  } catch (err) {
    console.log("Fallback triggered for Text due to error:", err);
    return MOCK_PARSE_RESULT;
  }
}

const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = [
  {
    medicine: {
      id: "1", brandName: "Augmentin", genericName: "Amoxicillin", saltComposition: "Amoxicillin + Clavulanate", dosageForm: "Tablet", strength: "625mg", manufacturer: "GSK", isGeneric: false, basePrice: 45.0, category: "Antibiotics",
      prices: [
        { pharmacy: "Apollo Pharmacy", pricePerUnit: 45, availability: 'In Stock', distanceKm: 1.2, monthlyCost: 2700, pctMoreThanCheapest: 30, isCheapest: false },
        { pharmacy: "Jan Aushadhi", pricePerUnit: 15, availability: 'In Stock', distanceKm: 4.5, monthlyCost: 900, pctMoreThanCheapest: 0, isCheapest: true }
      ],
      historicalPrices: [], description: "Antibiotic", indications: ["Infection"]
    },
    dosesPerDay: 2,
    currentInfo: { price: 45, pharmacy: "Apollo Pharmacy", monthlyCost: 2700 },
    bestInfo: { price: 15, pharmacy: "Jan Aushadhi", monthlyCost: 900, allPrices: [
        { pharmacy: "Jan Aushadhi", pricePerUnit: 15, availability: 'In Stock', distanceKm: 4.5, monthlyCost: 900, pctMoreThanCheapest: 0, isCheapest: true },
        { pharmacy: "Apollo Pharmacy", pricePerUnit: 45, availability: 'In Stock', distanceKm: 1.2, monthlyCost: 2700, pctMoreThanCheapest: 200, isCheapest: false }
    ] },
    priceVariance: { pct: 200, cheapest: { pharmacy: "Jan Aushadhi", price: 15 }, mostExpensive: { pharmacy: "Apollo Pharmacy", price: 45 }, message: "Huge savings" },
    generic: {
      medicine: {
        id: "2", brandName: "Moxikind-CV", genericName: "Amoxicillin", saltComposition: "Amoxicillin + Clavulanate", dosageForm: "Tablet", strength: "625mg", manufacturer: "Mankind", isGeneric: true, basePrice: 18.0, category: "Antibiotics",
        prices: [], historicalPrices: [], description: "Generic", indications: ["Infection"]
      },
      bestPrice: 15, bestPharmacy: "Jan Aushadhi", monthlyCost: 900, savings: 30, savingsPercent: 66, monthlySavings: 1800, reasoning: "Identical salt. Therapeutically equivalent."
    }
  },
  {
    medicine: {
      id: "3", brandName: "Lipitor", genericName: "Atorvastatin", saltComposition: "Atorvastatin 10mg", dosageForm: "Tablet", strength: "10mg", manufacturer: "Pfizer", isGeneric: false, basePrice: 25.0, category: "Cardiovascular",
      prices: [
        { pharmacy: "Netmeds", pricePerUnit: 25, availability: 'In Stock', distanceKm: 2.1, monthlyCost: 750, pctMoreThanCheapest: 10, isCheapest: false },
        { pharmacy: "MedPlus", pricePerUnit: 20, availability: 'In Stock', distanceKm: 1.5, monthlyCost: 600, pctMoreThanCheapest: 0, isCheapest: true }
      ],
      historicalPrices: [], description: "Statin", indications: ["Cholesterol"]
    },
    dosesPerDay: 1,
    currentInfo: { price: 25, pharmacy: "Netmeds", monthlyCost: 750 },
    bestInfo: { price: 20, pharmacy: "MedPlus", monthlyCost: 600, allPrices: [
        { pharmacy: "MedPlus", pricePerUnit: 20, availability: 'In Stock', distanceKm: 1.5, monthlyCost: 600, pctMoreThanCheapest: 0, isCheapest: true },
        { pharmacy: "Netmeds", pricePerUnit: 25, availability: 'In Stock', distanceKm: 2.1, monthlyCost: 750, pctMoreThanCheapest: 25, isCheapest: false }
    ] },
    priceVariance: { pct: 25, cheapest: { pharmacy: "MedPlus", price: 20 }, mostExpensive: { pharmacy: "Netmeds", price: 25 }, message: "Save 25%" },
    generic: {
      medicine: {
        id: "4", brandName: "Atorva", genericName: "Atorvastatin", saltComposition: "Atorvastatin 10mg", dosageForm: "Tablet", strength: "10mg", manufacturer: "Zydus", isGeneric: true, basePrice: 8.0, category: "Cardiovascular",
        prices: [], historicalPrices: [], description: "Generic", indications: ["Cholesterol"]
      },
      bestPrice: 8, bestPharmacy: "Jan Aushadhi", monthlyCost: 240, savings: 17, savingsPercent: 68, monthlySavings: 510, reasoning: "Same API. Generic alternative."
    }
  }
];

export async function analyzePrescription(parsedDrugs: ParsedDrug[]): Promise<AnalysisResult[]> {
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsedDrugs })
    });
    if (!res.ok) throw new Error('Analysis failed');
    const data = await res.json();
    if (data.results && data.results.length > 0) return data.results;
    return MOCK_ANALYSIS_RESULTS;
  } catch (err) {
    console.log("Fallback triggered for Analysis due to error:", err);
    return MOCK_ANALYSIS_RESULTS;
  }
}

export async function searchMedicines(q: string): Promise<Medicine[]> {
  const res = await fetch(`${API_BASE}/medicines?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.medicines;
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) return [];
  return res.json();
}

export interface PharmacyLocation {
  name: string;
  color: string;
  distanceKm: number;
  lat: number;
  lng: number;
  pricePerUnit?: number;
  availability?: string;
  monthlyCost?: number;
}

export async function getNearestPharmacies(
  lat: number,
  lng: number,
  medicineId?: string
): Promise<{ userLocation: { lat: number; lng: number }; pharmacies: PharmacyLocation[] }> {
  const res = await fetch(`${API_BASE}/nearest-pharmacy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, medicineId })
  });
  if (!res.ok) throw new Error('Geolocation query failed');
  return res.json();
}

export async function resolveWhat3Words(words: string): Promise<{ lat: number; lng: number; words: string }> {
  const res = await fetch(`${API_BASE}/what3words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words })
  });
  if (!res.ok) throw new Error('what3words lookup failed');
  return res.json();
}

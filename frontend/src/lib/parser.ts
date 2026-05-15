import { ParsedDrug } from './api';
import { getMedicineByMatch } from './db';

const DOSAGE_FORMS = ['tablet','capsule','syrup','injection','drops','cream','gel','inhaler','patch','suspension','lotion','spray','ointment'];
const FREQ_MAP: Record<string, number> = {
  'once a day':1,'once daily':1,'od':1,'qd':1,'daily':1,'once':1,
  'twice a day':2,'twice daily':2,'bd':2,'bid':2,'twice':2,
  'three times a day':3,'three times daily':3,'thrice daily':3,'thrice':3,'tds':3,'tid':3,
  'four times a day':4,'four times daily':4,'qid':4,'qds':4
};

export async function localParseText(rawText: string): Promise<ParsedDrug[]> {
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[|]{1}/g, 'I')          // common OCR mistake
    .replace(/\b0(?=[a-zA-Z])/g, 'O') // 0mg → Omg (rare)
    .trim();

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const parsed: ParsedDrug[] = [];

  for (const line of lines) {
    const ll = line.toLowerCase();

    if (/^(date|patient|doctor|dr\.|rx|name|age|address|diagnosis|clinic|hospital)/i.test(line)) continue;
    if (line.length < 4) continue;

    const formMatch = DOSAGE_FORMS.find(f => ll.includes(f));
    const form = formMatch || 'Tablet';

    let frequency: string | null = null, freqTimesPerDay: number | null = null;
    const freqKeys = Object.keys(FREQ_MAP).sort((a, b) => b.length - a.length);
    for (const key of freqKeys) {
      if (ll.includes(key)) { frequency = key.toUpperCase(); freqTimesPerDay = FREQ_MAP[key]; break; }
    }

    const durMatch = ll.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
    const duration = durMatch ? `${durMatch[1]} ${durMatch[2]}` : null;

    const strMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g\b|ml|iu|%)/i);
    const strength = strMatch ? `${strMatch[1]}${strMatch[2].toLowerCase()}` : null;

    let drugName = line;
    if (strMatch) {
      drugName = line.substring(0, strMatch.index);
    } else {
      const markerMatch = ll.match(/\b(tab|cap|syr|tablet|capsule|syrup|twice|thrice|once|daily)\b/i);
      if (markerMatch) drugName = line.substring(0, markerMatch.index);
    }

    drugName = drugName
      .replace(/[-–(),\/]+$/, '')
      .trim();

    if (!drugName || drugName.length < 2) continue;

    let dbMatch = await getMedicineByMatch(drugName);
    if (!dbMatch && strength) {
        dbMatch = await getMedicineByMatch(strength);
    }

    parsed.push({
      rawLine: line,
      drugName,
      saltComposition: dbMatch?.saltComposition ?? null,
      dosageForm: form.charAt(0).toUpperCase() + form.slice(1),
      strength,
      frequency,
      freqTimesPerDay,
      duration,
      dbMatch: dbMatch || null,
      confidence: dbMatch ? 'high' : 'low'
    });
  }

  return parsed;
}

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { getCategoriesLocal, getGenericBySalt, getMedicineByMatch, getPharmaciesLocal, searchMedicinesLocal } from './db';
import { localParseText } from './parser';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface MedicinePrice {
  pharmacy: string;
  pricePerUnit: number;
  availability: 'In Stock' | 'Limited';
  distanceKm: number;
  monthlyCost: number;
  pctMoreThanCheapest: number;
  isCheapest: boolean;
  lat?: number;
  lng?: number;
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

async function buildResult(matched: Medicine, freqTimesPerDay: number | null): Promise<AnalysisResult> {
  const dosesPerDay = freqTimesPerDay || 1;
  const sorted = [...matched.prices].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const bestPrice = sorted[0];
  const worstPrice = sorted[sorted.length - 1] || bestPrice;

  const priceVariancePct = bestPrice && bestPrice.pricePerUnit > 0
    ? Math.round(((worstPrice.pricePerUnit - bestPrice.pricePerUnit) / bestPrice.pricePerUnit) * 100)
    : 0;

  const enrichedPrices = sorted.map((p, idx) => {
    const monthlyCost = parseFloat((p.pricePerUnit * dosesPerDay * 30).toFixed(2));
    const vsChepeast = idx === 0 ? 0 : Math.round(((p.pricePerUnit - bestPrice.pricePerUnit) / bestPrice.pricePerUnit) * 100);
    return {
      ...p,
      monthlyCost,
      pctMoreThanCheapest: vsChepeast,
      isCheapest: idx === 0
    };
  });

  let genericAlt = null;
  if (!matched.isGeneric && matched.saltComposition) {
    const gen = await getGenericBySalt(matched.saltComposition, matched.id);
    if (gen && gen.prices.length > 0) {
      const gs = [...gen.prices].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      const gb = gs[0];
      const sav = worstPrice.pricePerUnit - gb.pricePerUnit;
      const genMonthly = parseFloat((gb.pricePerUnit * dosesPerDay * 30).toFixed(2));
      genericAlt = {
        medicine: gen,
        bestPrice: gb.pricePerUnit,
        bestPharmacy: gb.pharmacy,
        monthlyCost: genMonthly,
        savings: parseFloat(sav.toFixed(2)),
        savingsPercent: Math.round((sav / worstPrice.pricePerUnit) * 100),
        monthlySavings: parseFloat(((worstPrice.pricePerUnit - gb.pricePerUnit) * dosesPerDay * 30).toFixed(2)),
        reasoning: `Identical salt (${gen.saltComposition}). Therapeutically equivalent — only the brand differs.`
      };
    }
  }

  const currentMonthlyCost = worstPrice ? parseFloat((worstPrice.pricePerUnit * dosesPerDay * 30).toFixed(2)) : 0;
  const bestMonthlyCost = bestPrice ? parseFloat((bestPrice.pricePerUnit * dosesPerDay * 30).toFixed(2)) : 0;

  return {
    medicine: matched,
    dosesPerDay,
    currentInfo: { 
      price: worstPrice?.pricePerUnit || 0, 
      pharmacy: worstPrice?.pharmacy || '', 
      monthlyCost: currentMonthlyCost 
    },
    bestInfo: { 
      price: bestPrice?.pricePerUnit || 0, 
      pharmacy: bestPrice?.pharmacy || '', 
      monthlyCost: bestMonthlyCost, 
      allPrices: enrichedPrices 
    },
    priceVariance: {
      pct: priceVariancePct,
      cheapest: { pharmacy: bestPrice?.pharmacy || '', price: bestPrice?.pricePerUnit || 0 },
      mostExpensive: { pharmacy: worstPrice?.pharmacy || '', price: worstPrice?.pricePerUnit || 0 },
      message: priceVariancePct > 0
        ? `You pay ${priceVariancePct}% more at ${worstPrice.pharmacy} vs ${bestPrice.pharmacy}`
        : 'All pharmacies have similar pricing'
    },
    generic: genericAlt
  };
}

export async function parsePrescriptionFile(file: File): Promise<ParseResult> {
  let rawText = '';
  
  if (file.type === 'application/pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      rawText = text;
    } catch (e) {
      console.error('Local PDF Parse Error:', e);
    }
  } else if (file.type.startsWith('image/')) {
    try {
      const worker = await Tesseract.createWorker('eng', 1);
      const ret = await worker.recognize(file);
      rawText = ret.data.text;
      await worker.terminate();
    } catch (e) {
      console.error('Local OCR Error:', e);
    }
  }

  const parsedDrugs = await localParseText(rawText);
  return { parsedDrugs, rawText, fallback: false };
}

export async function parsePrescriptionText(text: string): Promise<ParseResult> {
  const parsedDrugs = await localParseText(text);
  return { parsedDrugs, rawText: text, fallback: false };
}

export async function analyzePrescription(parsedDrugs: ParsedDrug[]): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  
  for (const drug of parsedDrugs) {
    let matched = await getMedicineByMatch(drug.drugName);
    if (!matched && drug.saltComposition) {
      matched = await getMedicineByMatch(drug.saltComposition);
    }
    if (matched) {
      results.push(await buildResult(matched, drug.freqTimesPerDay));
    }
  }
  
  return results;
}

export async function searchMedicines(q: string): Promise<Medicine[]> {
  return searchMedicinesLocal(q);
}

export async function getCategories(): Promise<string[]> {
  return getCategoriesLocal();
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

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
}

export async function getNearestPharmacies(
  lat: number,
  lng: number,
  medicineId?: string
): Promise<{ userLocation: { lat: number; lng: number }; pharmacies: PharmacyLocation[] }> {
  const chains = await getPharmaciesLocal();
  
  let sorted = chains.map(chain => ({
    name: chain.name,
    color: chain.color,
    distanceKm: haversine(lat, lng, chain.lat, chain.lng),
    lat: chain.lat,
    lng: chain.lng
  })).sort((a, b) => a.distanceKm - b.distanceKm);
  
  if (medicineId) {
    // If a medicine is specified, we would normally append its prices.
    // For now we just return the sorted pharmacies. The components usually get prices from AnalysisResult anyway.
  }
  
  return { userLocation: { lat, lng }, pharmacies: sorted };
}

export async function resolveWhat3Words(words: string): Promise<{ lat: number; lng: number; words: string }> {
  // As a Serverless PWA, we cannot securely hide API keys.
  // This feature is disabled in offline mode.
  throw new Error('What3Words lookup is disabled in Offline PWA mode. Please use device location.');
}

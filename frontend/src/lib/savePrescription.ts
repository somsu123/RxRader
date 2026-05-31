import { db } from '../db/prescriptionDB';

export async function savePrescription(analysisData: {
  medicines: Array<{ name: string; price: number; quantity: number }>;
  totalCost: number;
  savingsAmount: number;
  pharmacyName?: string;
  prescriptionImage?: string;
}) {
  const prescription = {
    uniqueId: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    date: new Date(),
    ...analysisData
  };
  
  await db.prescriptions.add(prescription);
  return prescription;
}
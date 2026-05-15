import Dexie, { Table } from 'dexie';

export interface Prescription {
  id?: number;
  uniqueId: string;
  date: Date;
  medicines: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalCost: number;
  savingsAmount: number;
  pharmacyName?: string;
  prescriptionImage?: string; // base64
}

export class PrescriptionDatabase extends Dexie {
  prescriptions!: Table<Prescription>;

  constructor() {
    super('PrescriptionDB');
    this.version(1).stores({
      prescriptions: '++id, uniqueId, date, totalCost, savingsAmount'
    });
  }
}

export const db = new PrescriptionDatabase();
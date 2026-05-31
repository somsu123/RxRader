import Dexie, { Table } from 'dexie';

export interface Medicine {
  name: string;
  price: number;
  quantity: number;
}

export interface Prescription {
  id?: number;
  uniqueId: string;
  date: Date;
  medicines: Medicine[];
  totalCost: number;
  savingsAmount: number;
  pharmacyName?: string;
  prescriptionImage?: string;
}

export class PrescriptionDatabase extends Dexie {
  prescriptions!: Table<Prescription, number>;

  constructor() {
    super('PrescriptionDB');
    this.version(1).stores({
      prescriptions: '++id, uniqueId, date, totalCost, savingsAmount'
    });
  }
}

export const db = new PrescriptionDatabase();
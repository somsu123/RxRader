import Dexie, { Table } from 'dexie';

export interface Medication {
  id?: number;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | 'weekly' | 'custom';
  times: string[];
  startDate: Date;
  endDate?: Date;
  refillReminder: boolean;
  stockQuantity: number;
  refillThreshold: number;
  notes?: string;
}

export interface Schedule {
  id?: number;
  medicationId: number;
  scheduledTime: Date;
  taken: boolean;
  takenAt?: Date;
  skipped: boolean;
}

export class MedicationDatabase extends Dexie {
  medications!: Table<Medication>;
  schedules!: Table<Schedule>;

  constructor() {
    super('MedicationDB');
    this.version(1).stores({
      medications: '++id, name, frequency, startDate',
      schedules: '++id, medicationId, scheduledTime, taken'
    });
  }
}

export const medDB = new MedicationDatabase();
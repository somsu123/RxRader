import initSqlJs, { Database } from 'sql.js';
import { Medicine, MedicinePrice, HistoricalPrice } from './api';

let dbInstance: Database | null = null;
let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = (async () => {
      // Load sql.js WASM from the public folder or CDN
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      const res = await fetch('/rxradar.db');
      if (!res.ok) throw new Error('Failed to fetch /rxradar.db');
      const buf = await res.arrayBuffer();
      dbInstance = new SQL.Database(new Uint8Array(buf));
    })();
  }
  await initPromise;
  return dbInstance!;
}

function mapMedicineRow(row: any[]): Partial<Medicine> {
  // SQLite columns: id, brand_name, generic_name, salt_composition, dosage_form, strength, manufacturer, is_generic, base_price, category, description
  return {
    id: row[0] as string,
    brandName: row[1] as string,
    genericName: row[2] as string,
    saltComposition: row[3] as string,
    dosageForm: row[4] as string,
    strength: row[5] as string,
    manufacturer: row[6] as string,
    isGeneric: Boolean(row[7]),
    basePrice: row[8] as number,
    category: row[9] ? (row[9] as string) : undefined,
    description: row[10] ? (row[10] as string) : ''
  };
}

async function getPricesForMedicine(db: Database, medicineId: string): Promise<MedicinePrice[]> {
  const stmt = db.prepare(`
    SELECT
      p.price_per_unit, p.availability, p.distance_km, p.lat, p.lng, ph.name
    FROM prices p
    JOIN pharmacies ph ON ph.id = p.pharmacy_id
    WHERE p.medicine_id = ?
    ORDER BY p.price_per_unit ASC
  `);
  stmt.bind([medicineId]);
  
  const prices: MedicinePrice[] = [];
  while (stmt.step()) {
    const row = stmt.get();
    prices.push({
      pricePerUnit: row[0] as number,
      availability: row[1] as any,
      distanceKm: row[2] as number,
      lat: row[3] as number,
      lng: row[4] as number,
      pharmacy: row[5] as string,
      monthlyCost: 0,
      pctMoreThanCheapest: 0,
      isCheapest: false
    });
  }
  stmt.free();
  return prices;
}

async function getHistoryForMedicine(db: Database, medicineId: string): Promise<HistoricalPrice[]> {
  const stmt = db.prepare(`SELECT date, price FROM historical_prices WHERE medicine_id = ? ORDER BY date ASC`);
  stmt.bind([medicineId]);
  const history: HistoricalPrice[] = [];
  while (stmt.step()) {
    const row = stmt.get();
    history.push({ date: row[0] as string, price: row[1] as number });
  }
  stmt.free();
  return history;
}

async function getIndicationsForMedicine(db: Database, medicineId: string): Promise<string[]> {
  const stmt = db.prepare(`SELECT indication FROM indications WHERE medicine_id = ? ORDER BY id ASC`);
  stmt.bind([medicineId]);
  const indications: string[] = [];
  while (stmt.step()) {
    indications.push(stmt.get()[0] as string);
  }
  stmt.free();
  return indications;
}

async function hydrateMedicine(db: Database, row: any[]): Promise<Medicine | null> {
  if (!row) return null;
  const partial = mapMedicineRow(row);
  const id = partial.id!;
  
  const prices = await getPricesForMedicine(db, id);
  const historicalPrices = await getHistoryForMedicine(db, id);
  const indications = await getIndicationsForMedicine(db, id);
  
  return {
    ...partial,
    prices,
    historicalPrices,
    indications
  } as Medicine;
}

export async function getMedicineByMatch(term: string): Promise<Medicine | null> {
  const db = await initDb();
  const lt = term.toLowerCase().trim();
  if (lt.length < 2) return null;

  const stmt = db.prepare(`
    SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
           manufacturer, is_generic, base_price, category, description
    FROM medicines
    WHERE LOWER(brand_name) LIKE ?
       OR LOWER(generic_name) LIKE ?
       OR LOWER(salt_composition) LIKE ?
       OR ? LIKE '%' || LOWER(brand_name) || '%'
       OR ? LIKE '%' || LOWER(generic_name) || '%'
    LIMIT 1
  `);
  
  stmt.bind([`%${lt}%`, `%${lt}%`, `%${lt}%`, lt, lt]);
  
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    return hydrateMedicine(db, row);
  }
  stmt.free();
  return null;
}

export async function getGenericBySalt(saltComposition: string, excludeId: string): Promise<Medicine | null> {
  const db = await initDb();
  const stmt = db.prepare(`
    SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
           manufacturer, is_generic, base_price, category, description
    FROM medicines
    WHERE is_generic = 1 AND salt_composition = ? AND id != ?
    LIMIT 1
  `);
  stmt.bind([saltComposition, excludeId]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    return hydrateMedicine(db, row);
  }
  stmt.free();
  return null;
}

export async function searchMedicinesLocal(q: string, category?: string, isGeneric?: boolean): Promise<Medicine[]> {
  const db = await initDb();
  let query = `
    SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
           manufacturer, is_generic, base_price, category, description
    FROM medicines
  `;
  const clauses: string[] = [];
  const params: any[] = [];

  if (q) {
    const lq = q.toLowerCase();
    clauses.push('(LOWER(brand_name) LIKE ? OR LOWER(generic_name) LIKE ? OR LOWER(salt_composition) LIKE ?)');
    params.push(`%${lq}%`, `%${lq}%`, `%${lq}%`);
  }
  if (category) {
    clauses.push('LOWER(category) = ?');
    params.push(category.toLowerCase());
  }
  if (isGeneric !== undefined) {
    clauses.push('is_generic = ?');
    params.push(isGeneric ? 1 : 0);
  }

  if (clauses.length > 0) {
    query += ' WHERE ' + clauses.join(' AND ');
  }
  query += ' ORDER BY brand_name ASC';

  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results: Medicine[] = [];
  while (stmt.step()) {
    const med = await hydrateMedicine(db, stmt.get());
    if (med) results.push(med);
  }
  stmt.free();
  return results;
}

export async function getCategoriesLocal(): Promise<string[]> {
  const db = await initDb();
  const stmt = db.prepare(`
    SELECT DISTINCT category
    FROM medicines
    WHERE category IS NOT NULL AND category != ''
    ORDER BY category ASC
  `);
  
  const categories: string[] = [];
  while (stmt.step()) {
    categories.push(stmt.get()[0] as string);
  }
  stmt.free();
  return categories;
}

export async function getPharmaciesLocal(): Promise<any[]> {
  const db = await initDb();
  const stmt = db.prepare('SELECT name, lat, lng, color FROM pharmacies ORDER BY name ASC');
  const pharmacies: any[] = [];
  while (stmt.step()) {
    const row = stmt.get();
    pharmacies.push({ name: row[0], lat: row[1], lng: row[2], color: row[3] });
  }
  stmt.free();
  return pharmacies;
}

export async function getMedicineById(id: string): Promise<Medicine | null> {
  const db = await initDb();
  const stmt = db.prepare(`
    SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
           manufacturer, is_generic, base_price, category, description
    FROM medicines WHERE id = ?
  `);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    return hydrateMedicine(db, row);
  }
  stmt.free();
  return null;
}

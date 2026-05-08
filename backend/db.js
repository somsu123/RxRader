const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'rxradar.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function assertSchema() {
  const row = getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='medicines'")
    .get();
  if (!row) {
    throw new Error('Database not initialized. Run: node init-db.js');
  }
}

function mapMedicineRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    brandName: row.brand_name,
    genericName: row.generic_name,
    saltComposition: row.salt_composition,
    dosageForm: row.dosage_form,
    strength: row.strength,
    manufacturer: row.manufacturer,
    isGeneric: Boolean(row.is_generic),
    basePrice: row.base_price,
    category: row.category || null,
    description: row.description || '',
  };
}

function getPricesForMedicine(medicineId) {
  return getDb()
    .prepare(
      `SELECT
        p.price_per_unit AS pricePerUnit,
        p.availability AS availability,
        p.distance_km AS distanceKm,
        p.lat AS lat,
        p.lng AS lng,
        ph.name AS pharmacy
       FROM prices p
       JOIN pharmacies ph ON ph.id = p.pharmacy_id
       WHERE p.medicine_id = ?
       ORDER BY p.price_per_unit ASC`
    )
    .all(medicineId)
    .map(row => ({
      pharmacy: row.pharmacy,
      pricePerUnit: row.pricePerUnit,
      availability: row.availability,
      distanceKm: row.distanceKm,
      lat: row.lat,
      lng: row.lng,
    }));
}

function getHistoryForMedicine(medicineId) {
  return getDb()
    .prepare(
      `SELECT date, price
       FROM historical_prices
       WHERE medicine_id = ?
       ORDER BY date ASC`
    )
    .all(medicineId)
    .map(row => ({ date: row.date, price: row.price }));
}

function getIndicationsForMedicine(medicineId) {
  return getDb()
    .prepare(
      `SELECT indication
       FROM indications
       WHERE medicine_id = ?
       ORDER BY id ASC`
    )
    .all(medicineId)
    .map(row => row.indication);
}

function hydrateMedicine(row) {
  const medicine = mapMedicineRow(row);
  if (!medicine) return null;
  medicine.prices = getPricesForMedicine(medicine.id);
  medicine.historicalPrices = getHistoryForMedicine(medicine.id);
  medicine.indications = getIndicationsForMedicine(medicine.id);
  return medicine;
}

function getMedicineById(id) {
  const row = getDb()
    .prepare(
      `SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
              manufacturer, is_generic, base_price, category, description
       FROM medicines
       WHERE id = ?`
    )
    .get(id);
  return hydrateMedicine(row);
}

function getMedicineByMatch(term) {
  if (!term) return null;
  const lt = term.toLowerCase().trim();
  if (lt.length < 2) return null;

  const row = getDb()
    .prepare(
      `SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
              manufacturer, is_generic, base_price, category, description
       FROM medicines
       WHERE LOWER(brand_name) LIKE ?
          OR LOWER(generic_name) LIKE ?
          OR LOWER(salt_composition) LIKE ?
          OR ? LIKE '%' || LOWER(brand_name) || '%'
          OR ? LIKE '%' || LOWER(generic_name) || '%'
       LIMIT 1`
    )
    .get(`%${lt}%`, `%${lt}%`, `%${lt}%`, lt, lt);

  return hydrateMedicine(row);
}

function getMedicines({ q, category, isGeneric }) {
  const clauses = [];
  const params = [];

  if (q) {
    const lq = q.toLowerCase();
    clauses.push(
      '(LOWER(brand_name) LIKE ? OR LOWER(generic_name) LIKE ? OR LOWER(salt_composition) LIKE ?)'
    );
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

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = getDb()
    .prepare(
      `SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
              manufacturer, is_generic, base_price, category, description
       FROM medicines
       ${whereClause}
       ORDER BY brand_name ASC`
    )
    .all(...params);

  return rows.map(hydrateMedicine);
}

function getCategories() {
  return getDb()
    .prepare(
      `SELECT DISTINCT category
       FROM medicines
       WHERE category IS NOT NULL AND category != ''
       ORDER BY category ASC`
    )
    .all()
    .map(row => row.category);
}

function getPharmacies() {
  return getDb()
    .prepare('SELECT name, lat, lng, color FROM pharmacies ORDER BY name ASC')
    .all();
}

function getGenericBySalt(saltComposition, excludeId) {
  const row = getDb()
    .prepare(
      `SELECT id, brand_name, generic_name, salt_composition, dosage_form, strength,
              manufacturer, is_generic, base_price, category, description
       FROM medicines
       WHERE is_generic = 1 AND salt_composition = ? AND id != ?
       LIMIT 1`
    )
    .get(saltComposition, excludeId);

  return hydrateMedicine(row);
}

module.exports = {
  assertSchema,
  getMedicineById,
  getMedicineByMatch,
  getMedicines,
  getCategories,
  getPharmacies,
  getGenericBySalt,
};

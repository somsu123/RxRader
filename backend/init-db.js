const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'rxradar.db');
const jsonPath = path.join(__dirname, 'medicines.json');

if (!fs.existsSync(jsonPath)) {
  console.error('medicines.json not found. Run: node generate-db.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    salt_composition TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    strength TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    is_generic INTEGER NOT NULL,
    base_price REAL NOT NULL,
    category TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS pharmacies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id TEXT NOT NULL,
    pharmacy_id INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,
    availability TEXT NOT NULL,
    distance_km REAL,
    lat REAL,
    lng REAL,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
  );

  CREATE TABLE IF NOT EXISTS indications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id TEXT NOT NULL,
    indication TEXT NOT NULL,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
  );

  CREATE TABLE IF NOT EXISTS historical_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id TEXT NOT NULL,
    date TEXT NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
  );

  CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand_name);
  CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
  CREATE INDEX IF NOT EXISTS idx_medicines_salt ON medicines(salt_composition);
  CREATE INDEX IF NOT EXISTS idx_prices_medicine ON prices(medicine_id);
  CREATE INDEX IF NOT EXISTS idx_prices_pharmacy ON prices(pharmacy_id);
  CREATE INDEX IF NOT EXISTS idx_hist_medicine ON historical_prices(medicine_id);
  CREATE INDEX IF NOT EXISTS idx_indications_medicine ON indications(medicine_id);
`);

const clearData = db.transaction(() => {
  db.exec('DELETE FROM historical_prices;');
  db.exec('DELETE FROM indications;');
  db.exec('DELETE FROM prices;');
  db.exec('DELETE FROM pharmacies;');
  db.exec('DELETE FROM medicines;');
});

clearData();

const insertPharmacy = db.prepare(
  'INSERT INTO pharmacies (name, lat, lng, color) VALUES (?, ?, ?, ?)'
);
const insertMedicine = db.prepare(
  `INSERT INTO medicines (
    id, brand_name, generic_name, salt_composition, dosage_form, strength,
    manufacturer, is_generic, base_price, category, description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertPrice = db.prepare(
  `INSERT INTO prices (
    medicine_id, pharmacy_id, price_per_unit, availability, distance_km, lat, lng
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const insertIndication = db.prepare(
  'INSERT INTO indications (medicine_id, indication) VALUES (?, ?)'
);
const insertHistory = db.prepare(
  'INSERT INTO historical_prices (medicine_id, date, price) VALUES (?, ?, ?)'
);

const pharmacyIdByName = new Map();

const importAll = db.transaction(() => {
  data.pharmacies.forEach(pharmacy => {
    const info = insertPharmacy.run(
      pharmacy.name,
      pharmacy.lat,
      pharmacy.lng,
      pharmacy.color
    );
    pharmacyIdByName.set(pharmacy.name, info.lastInsertRowid);
  });

  data.medicines.forEach(med => {
    insertMedicine.run(
      med.id,
      med.brandName,
      med.genericName,
      med.saltComposition,
      med.dosageForm,
      med.strength,
      med.manufacturer,
      med.isGeneric ? 1 : 0,
      med.basePrice,
      med.category || null,
      med.description || ''
    );

    (med.indications || []).forEach(indication => {
      insertIndication.run(med.id, indication);
    });

    (med.historicalPrices || []).forEach(entry => {
      insertHistory.run(med.id, entry.date, entry.price);
    });

    (med.prices || []).forEach(price => {
      const pharmacyId = pharmacyIdByName.get(price.pharmacy);
      if (!pharmacyId) return;
      insertPrice.run(
        med.id,
        pharmacyId,
        price.pricePerUnit,
        price.availability,
        price.distanceKm ?? null,
        price.lat ?? null,
        price.lng ?? null
      );
    });
  });
});

importAll();

console.log(`✅ SQLite DB ready: ${dbPath}`);
console.log(`✅ Pharmacies: ${data.pharmacies.length}`);
console.log(`✅ Medicines: ${data.medicines.length}`);

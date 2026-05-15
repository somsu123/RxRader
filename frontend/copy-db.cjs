const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const jsonPath = path.join(__dirname, '../backend/medicines.json');
const publicDir = path.join(__dirname, 'public');
const targetDb = path.join(publicDir, 'rxradar.db');

async function buildDb() {
  if (!fs.existsSync(jsonPath)) {
    console.error('medicines.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY, brand_name TEXT NOT NULL, generic_name TEXT NOT NULL,
      salt_composition TEXT NOT NULL, dosage_form TEXT NOT NULL, strength TEXT NOT NULL,
      manufacturer TEXT NOT NULL, is_generic INTEGER NOT NULL, base_price REAL NOT NULL,
      category TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS pharmacies (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
      lat REAL NOT NULL, lng REAL NOT NULL, color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT, medicine_id TEXT NOT NULL,
      pharmacy_id INTEGER NOT NULL, price_per_unit REAL NOT NULL, availability TEXT NOT NULL,
      distance_km REAL, lat REAL, lng REAL
    );
    CREATE TABLE IF NOT EXISTS indications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, medicine_id TEXT NOT NULL, indication TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS historical_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT, medicine_id TEXT NOT NULL, date TEXT NOT NULL, price REAL NOT NULL
    );
  `);

  const insertPharmacy = `INSERT INTO pharmacies (name, lat, lng, color) VALUES (?, ?, ?, ?)`;
  const insertMedicine = `INSERT INTO medicines (id, brand_name, generic_name, salt_composition, dosage_form, strength, manufacturer, is_generic, base_price, category, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const insertPrice = `INSERT INTO prices (medicine_id, pharmacy_id, price_per_unit, availability, distance_km, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const insertIndication = `INSERT INTO indications (medicine_id, indication) VALUES (?, ?)`;
  const insertHistory = `INSERT INTO historical_prices (medicine_id, date, price) VALUES (?, ?, ?)`;

  const pharmacyIdByName = new Map();
  let pharmId = 1;

  data.pharmacies.forEach(pharmacy => {
    db.run(insertPharmacy, [pharmacy.name, pharmacy.lat, pharmacy.lng, pharmacy.color]);
    pharmacyIdByName.set(pharmacy.name, pharmId++);
  });

  data.medicines.forEach(med => {
    db.run(insertMedicine, [
      med.id, med.brandName, med.genericName, med.saltComposition, med.dosageForm,
      med.strength, med.manufacturer, med.isGeneric ? 1 : 0, med.basePrice,
      med.category || null, med.description || ''
    ]);

    (med.indications || []).forEach(indication => {
      db.run(insertIndication, [med.id, indication]);
    });

    (med.historicalPrices || []).forEach(entry => {
      db.run(insertHistory, [med.id, entry.date, entry.price]);
    });

    (med.prices || []).forEach(price => {
      const pid = pharmacyIdByName.get(price.pharmacy);
      if (!pid) return;
      db.run(insertPrice, [med.id, pid, price.pricePerUnit, price.availability, price.distanceKm ?? null, price.lat ?? null, price.lng ?? null]);
    });
  });

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const binaryArray = db.export();
  fs.writeFileSync(targetDb, Buffer.from(binaryArray));
  console.log('✅ SQLite DB generated via sql.js at:', targetDb);
}

buildDb().catch(console.error);

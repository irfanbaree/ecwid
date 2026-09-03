// One-time data migration: converts Bundle.product_ids from a plain array of
// ids (old shape, qty implicitly 1) to [{ productId, qty }] (new shape).
// Idempotent - safe to re-run; rows already in the new shape are left as-is.
//
// Run manually, once, before deploying the qty-aware bundle stock sync:
//   node scripts/migrate-bundle-qty.js
//
// Prerequisite (sequelize.sync() does not alter existing columns):
//   ALTER TABLE Bundles MODIFY COLUMN product_ids TEXT;

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
  port: DB_PORT || 3306,
});

const Bundle = sequelize.define('Bundle', {
  name: { type: DataTypes.STRING, allowNull: false },
  product_ids: { type: DataTypes.TEXT, allowNull: false },
  store_id: { type: DataTypes.STRING, allowNull: false },
  discount: { type: DataTypes.FLOAT, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  price: { type: DataTypes.FLOAT, allowNull: false },
  costPrice: { type: DataTypes.FLOAT, allowNull: false },
  ecwid_id: { type: DataTypes.INTEGER, allowNull: true },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { timestamps: false });

function migrateEntry(entry) {
  if (entry && typeof entry === 'object') {
    return { productId: entry.productId, qty: Math.max(1, parseInt(entry.qty, 10) || 1) };
  }
  return { productId: entry, qty: 1 };
}

async function run() {
  const bundles = await Bundle.findAll();
  console.log(`Found ${bundles.length} bundle(s) to check.`);

  let migrated = 0;
  let skipped = 0;

  for (const bundle of bundles) {
    let parsed;
    try {
      parsed = JSON.parse(bundle.product_ids);
    } catch (err) {
      console.warn(`Bundle ${bundle.id}: could not parse product_ids (${bundle.product_ids}), skipping.`);
      skipped++;
      continue;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn(`Bundle ${bundle.id}: product_ids is empty or not an array, skipping.`);
      skipped++;
      continue;
    }

    const alreadyMigrated = parsed.every((entry) => entry && typeof entry === 'object' && 'productId' in entry && 'qty' in entry);
    if (alreadyMigrated) {
      skipped++;
      continue;
    }

    const newShape = parsed.map(migrateEntry);
    await bundle.update({ product_ids: JSON.stringify(newShape) });
    console.log(`Bundle ${bundle.id} ("${bundle.name}"): migrated ${parsed.length} child id(s) to qty-aware shape.`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, already up to date / skipped: ${skipped}.`);
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());

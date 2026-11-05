/**
 * One-off migration: bring pre-RBAC accounts onto the new role model.
 *
 *   node scripts/migrateRoles.js
 *
 * - Legacy `admin` -> `super_admin`
 * - Any non-canonical casing ("Super Admin") -> canonical snake_case
 * - Missing `isActive` -> true
 */
import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import { User } from '../src/models/index.js';
import { normalizeRole } from '../src/utils/index.js';

const run = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const legacy = await User.collection.updateMany(
    { role: 'admin' },
    { $set: { role: 'super_admin' } },
  );
  console.log(`Legacy "admin" accounts migrated: ${legacy.modifiedCount}`);

  let normalized = 0;
  const cursor = User.collection.find({});
  for await (const doc of cursor) {
    const canonical = normalizeRole(doc.role);
    if (canonical !== doc.role) {
      await User.collection.updateOne(
        { _id: doc._id },
        { $set: { role: canonical } },
      );
      normalized += 1;
    }
  }
  console.log(`Role values normalized: ${normalized}`);

  const activated = await User.collection.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } },
  );
  console.log(`Accounts flagged as active: ${activated.modifiedCount}`);

  await mongoose.disconnect();
  console.log('Migration complete');
};

run().catch(async error => {
  console.error('Migration failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});

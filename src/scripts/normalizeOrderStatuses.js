import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { Order } from '../models/index.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../utils/index.js';

/**
 * One-off maintenance script.
 *
 * Older write-paths stored enum values in UPPERCASE ('PAID', 'CANCELLED'...)
 * while the schema enum and every aggregation use lowercase constants. This
 * script normalizes existing documents so case-sensitive queries (e.g. the
 * dashboard revenue aggregation) match again.
 *
 * Run from the backend folder:  node src/scripts/normalizeOrderStatuses.js
 */
const normalizeField = async (field, values) => {
  let modified = 0;

  for (const canonical of values) {
    const result = await Order.updateMany(
      { [field]: { $regex: new RegExp(`^${canonical}$`, 'i') } },
      { $set: { [field]: canonical } },
    );
    modified += result.modifiedCount ?? 0;
  }

  return modified;
};

const run = async () => {
  await mongoose.connect(config.mongoUri);

  const paymentModified = await normalizeField(
    'paymentStatus',
    Object.values(PAYMENT_STATUS),
  );
  const orderModified = await normalizeField(
    'orderStatus',
    Object.values(ORDER_STATUS),
  );

  console.log(
    `Normalized ${paymentModified} paymentStatus and ${orderModified} orderStatus document(s).`,
  );

  await mongoose.disconnect();
};

run().catch(async error => {
  console.error('Status normalization failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});

import mongoose, { Schema } from 'mongoose';

const paymentSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd', uppercase: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, required: true },
  stripePaymentId: { type: String, sparse: true },
}, { timestamps: true });

paymentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);


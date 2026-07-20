import mongoose, { Schema } from 'mongoose';

const transactionSchema = new Schema({
  buyer: { type: String, ref: 'User', required: true },
  seller: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled', 'refunded'], default: 'pending' },
}, { timestamps: true });

transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);


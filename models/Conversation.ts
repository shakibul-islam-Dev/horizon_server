import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true, maxlength: 10000 },
  attachments: [{ type: { type: String, default: 'image' }, url: { type: String } }],
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const conversationSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  title: { type: String, default: 'New Chat' },
  model: { type: String, default: 'ai' },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  lastMessage: { type: String, default: '' },
  messageCount: { type: Number, default: 0 },
  messages: [messageSchema],
}, { timestamps: true });

conversationSchema.index({ user: 1, status: 1, updatedAt: -1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);


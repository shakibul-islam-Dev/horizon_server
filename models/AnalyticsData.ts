const mongoose = require('mongoose');
const { Schema } = mongoose;

const analyticsDataSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true, enum: ['csv', 'json', 'xlsx'] },
  rawData: { type: Schema.Types.Mixed, required: true },
  analysis: {
    summary: { type: String, default: '' },
    trends: [{ type: String }],
    insights: [{ type: String }],
    kpis: { type: Schema.Types.Mixed, default: {} },
    risks: [{ type: String }],
  },
}, { timestamps: true });

analyticsDataSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsData', analyticsDataSchema);

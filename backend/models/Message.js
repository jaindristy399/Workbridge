const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // roomId = sorted combination of two user IDs (e.g., "userId1_userId2")
  roomId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

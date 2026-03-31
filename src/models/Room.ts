import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  type: { type: String, enum: ['global', 'group', 'dm'], required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Room = mongoose.model('Room', roomSchema);

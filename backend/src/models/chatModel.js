import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for faster lookups by members
chatSchema.index({ members: 1 });
chatSchema.index({ 'members.0': 1, 'members.1': 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);

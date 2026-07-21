import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    text: { type: String, maxlength: 4000 },
    image: { type: String },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    readAt: { type: Date },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date },
    deletedAt: { type: Date },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
},  { timestamps: true });

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, status: 1 });
messageSchema.index({ groupId: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, readBy: 1 });
messageSchema.index({ deletedFor: 1 });
messageSchema.index({ deletedAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

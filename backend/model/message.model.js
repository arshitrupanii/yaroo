import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    image: { type: String },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    readAt: { type: Date },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
},  { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;

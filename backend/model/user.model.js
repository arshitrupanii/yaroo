import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 24,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    profilePicture: {
        type: String,
        default: ''
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    passwordChangedAt: {
        type: Date
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequestsSent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequestsReceived: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, {
    timestamps: true
});

userSchema.index({ passwordResetToken: 1 });

export default mongoose.model('User', userSchema);

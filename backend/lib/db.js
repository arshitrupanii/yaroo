import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("MongoDB connected");
        }
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
};

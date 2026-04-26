import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("mongodb connect");
        }
    } catch (error) {
        console.log("Error in connection:", error);
    }
};

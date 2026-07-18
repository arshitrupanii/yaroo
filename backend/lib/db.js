import mongoose from "mongoose";

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const dbOptions = () => ({
    autoIndex: process.env.MONGO_AUTO_INDEX === "true" || process.env.NODE_ENV !== "production",
    maxPoolSize: toNumber(process.env.MONGO_MAX_POOL_SIZE, 20),
    minPoolSize: toNumber(process.env.MONGO_MIN_POOL_SIZE, 0),
    maxIdleTimeMS: toNumber(process.env.MONGO_MAX_IDLE_TIME_MS, 30000),
    serverSelectionTimeoutMS: toNumber(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10000),
    socketTimeoutMS: toNumber(process.env.MONGO_SOCKET_TIMEOUT_MS, 45000),
});

mongoose.set("strictQuery", true);

mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
    console.error(`MongoDB connection error: ${error.message}`);
});

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        const connection = await mongoose.connect(process.env.MONGODB_URI, dbOptions());
        console.log(`MongoDB connected to ${connection.connection.name}`);
        return connection.connection;
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
};

export const getDbHealth = () => ({
    status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
});

export const disconnectDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};

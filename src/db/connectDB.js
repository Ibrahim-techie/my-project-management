import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "projectmanagementDB",
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected successfully to ${mongoose.connection.name}✅`);
  }
  catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (error.reason?.servers) {
      for (const [address, server] of error.reason.servers) {
        console.error(`MongoDB node ${address}:`, server.error?.message ?? server.type);
      }
    }
    process.exit(1);
  }
}

export default connectDB;

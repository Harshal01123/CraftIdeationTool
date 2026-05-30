import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Trying to connect MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("Database Connected");
  } catch (error) {
    console.log("MongoDB Error:", error.message);
  }
};

export default connectDB;
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB Connected");
  } catch (error) {
    console.warn("MongoDB Connection Failed (non-fatal):", error.message);
    // Not exiting — report routes don't require MongoDB
  }
};

export default connectDB;
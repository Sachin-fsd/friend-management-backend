const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Using environment variable for DB URI
    const dbURI = process.env.MONGOURL;
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(dbURI);
      console.log("Database connected successfully");
    }
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw new Error("Database connection failed");
  }
};

module.exports =  connectDB ;

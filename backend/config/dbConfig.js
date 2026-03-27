import mongoose from 'mongoose';

const DB_NAME = process.env.DB_NAME;

export const ensureDatabaseName = (mongoURI) => {
  if (!mongoURI) {
    throw new Error("MongoDB URI is required");
  }

  if (mongoURI.includes('mongodb://') || mongoURI.includes('mongodb+srv://')) {
    const urlParts = mongoURI.split('/');
    const baseUrl = urlParts.slice(0, 3).join('/');
    const queryString = mongoURI.includes('?') ? mongoURI.substring(mongoURI.indexOf('?')) : '';

    return `${baseUrl}/${DB_NAME}${queryString}`;
  }

  return mongoURI;
};

export const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || process.env.DB;
    if (!mongoURI) {
      throw new Error("MONGODB_URI or DB environment variable is required");
    }

    mongoURI = ensureDatabaseName(mongoURI);

    await mongoose.connect(mongoURI, {
      dbName: DB_NAME
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error("❌ Database error:", err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
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

const MAX_ATTEMPTS = 3;
let connecting = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Connect with retries. Never exits the process: on serverless a single
// failed attempt during a cold start must not kill the function.
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connecting) return connecting;

  let mongoURI = process.env.MONGODB_URI || process.env.DB;
  if (!mongoURI) {
    throw new Error("MONGODB_URI or DB environment variable is required");
  }
  mongoURI = ensureDatabaseName(mongoURI);

  connecting = (async () => {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await mongoose.connect(mongoURI, {
          dbName: DB_NAME,
          serverSelectionTimeoutMS: 5000,
          maxPoolSize: 10,
        });
        return mongoose.connection;
      } catch (error) {
        lastError = error;
        console.error(`❌ Database connection failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, error.message);
        if (attempt < MAX_ATTEMPTS) await sleep(attempt * 1000);
      }
    }
    throw lastError;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Database disconnect failed:", error.message);
  }
};

// Log only: mongoose reconnects on its own.
mongoose.connection.on('error', (err) => {
  console.error("❌ Database error:", err.message);
});

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
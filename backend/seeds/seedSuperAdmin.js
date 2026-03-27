import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { Admin, AdminRoleEnum } from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

let MONGO_URI = process.env.MONGODB_URI || process.env.DB;
if (!MONGO_URI) {
  console.error("❌ Error: MONGODB_URI or DB environment variable is required");
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME;
if (DB_NAME && (MONGO_URI.includes('mongodb://') || MONGO_URI.includes('mongodb+srv://'))) {

  const urlParts = MONGO_URI.split('?');
  const baseUrl = urlParts[0];
  const queryString = urlParts[1] ? `?${urlParts[1]}` : '';

  let cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  const pathParts = cleanBaseUrl.split('/');
  const lastPart = pathParts[pathParts.length - 1];

  if (lastPart.includes('@') || lastPart === '' || pathParts.length <= 3) {
    cleanBaseUrl = `${cleanBaseUrl}/${DB_NAME}`;
  } else if (lastPart !== DB_NAME) {
    pathParts[pathParts.length - 1] = DB_NAME;
    cleanBaseUrl = pathParts.join('/');
  }

  MONGO_URI = `${cleanBaseUrl}${queryString}`;
}

async function seedSuperAdmin() {
  try {
    const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');

    const connectionOptions = {};
    if (DB_NAME) {
      connectionOptions.dbName = DB_NAME;
    }
    await mongoose.connect(MONGO_URI, connectionOptions);

    const existingSuperAdmin = await Admin.findOne({ role: AdminRoleEnum.SUPER_ADMIN });
    if (existingSuperAdmin) {
      return;
    }

    const superAdminData = {
      username: "honest",
      full_name: "Honest Super Admin",
      phone: "615600765",
      email: process.env.SEED_SUPER_ADMIN_EMAIL,
      password: "Honest-11",
      role: AdminRoleEnum.SUPER_ADMIN,
      faculty_id: null,
    };

    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
    superAdminData.password_hash = hashedPassword;

    const newSuperAdmin = new Admin(superAdminData);

    await newSuperAdmin.save();
  } catch (err) {
    console.error("❌ Error seeding super admin:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

seedSuperAdmin();
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Faculty, Admin, AdminRoleEnum } from "../models/index.js";

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
  const dbNamePattern = /\/([^/?]+)(\?|$)/;
  const match = MONGO_URI.match(dbNamePattern);

  if (match && match[1] && match[1] !== DB_NAME) {
    MONGO_URI = MONGO_URI.replace(dbNamePattern, `/${DB_NAME}$2`);
  } else if (!match || !match[1]) {
    if (MONGO_URI.includes('?')) {
      MONGO_URI = MONGO_URI.replace('?', `/${DB_NAME}?`);
    } else {
      MONGO_URI = `${MONGO_URI}/${DB_NAME}`;
    }
  }
}

const facultiesData = [
  { name: "Faculty of Science", code: "SCI" },
  { name: "Faculty of Engineering", code: "ENG" },
  { name: "Faculty of Economic and Management Science", code: "EMS" },
  { name: "Faculty of Agriculture and Environmental Sciences", code: "AES" },
  { name: "Faculty of Social Sciences", code: "SOC" },
  { name: "Faculty of Veterinary and Animal Husbandry", code: "VAH" },
  { name: "Faculty of Medicine and Surgery", code: "MED" },
  { name: "Faculty of Education", code: "EDU" },
  { name: "Sharia and Islamic Studies", code: "ISL" },
  { name: "Faculty of Language", code: "LAN" },
  { name: "Faculty of Law", code: "LAW" },
];

async function seedFaculties() {
  try {
    const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');

    const connectionOptions = {};
    if (DB_NAME) {
      connectionOptions.dbName = DB_NAME;
    }
    await mongoose.connect(MONGO_URI, connectionOptions);

    const adminUser = await Admin.findOne({ role: AdminRoleEnum.SUPER_ADMIN });
    if (!adminUser) {
      console.error("❌ Error: Super admin not found. Please run seedSuperAdmin.js first");
      return;
    }

    await Faculty.deleteMany({});
    let created = 0;
    let skipped = 0;

    for (const f of facultiesData) {
      const existingFaculty = await Faculty.findOne({ code: f.code });
      if (existingFaculty) {
        skipped++;
        continue;
      }
      const newFaculty = new Faculty({
        ...f,
        created_by: adminUser._id,
      });
      await newFaculty.save();
      created++;
    }

  } catch (err) {
    console.error("❌ Error seeding faculties:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

seedFaculties();
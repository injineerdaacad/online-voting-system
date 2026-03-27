import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  Faculty,
  Admin,
  Department,
  AdminRoleEnum,
} from "../models/index.js";

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

async function seedFacultyAdmins() {
  try {
    const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');

    const connectionOptions = {};
    if (DB_NAME) {
      connectionOptions.dbName = DB_NAME;
    }
    await mongoose.connect(MONGO_URI, connectionOptions);

    const superAdmin = await Admin.findOne({ role: AdminRoleEnum.SUPER_ADMIN });
    if (!superAdmin) {
      console.error("❌ Error: Super admin not found. Please run seedSuperAdmin.js first");
      return;
    }

    const faculties = await Faculty.find();
    if (!faculties.length) {
      console.error("❌ Error: No faculties found. Please run seedFaculty.js first");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const faculty of faculties) {
      const departments = await Department.find({ faculty_id: faculty._id });
      if (!departments.length) {
        continue;
      }

      for (const department of departments) {
        const existingAdmin = await Admin.findOne({
          role: AdminRoleEnum.ADMIN,
          faculty_id: faculty._id,
          department: department._id,
        });

        if (existingAdmin) {
          skipped++;
          continue;
        }

        const baseCode = (department.code || faculty.code).toLowerCase();
        const password = `Admin-11`;

        const newAdmin = new Admin({
          username: `${baseCode}-admin`,
          full_name: `${department.name} Admin`,
          phone: `61${Math.floor(1000000 + Math.random() * 8999999)}`,
          email: process.env.UNIVERSITY_EMAIL_DOMAIN
            ? `${baseCode}-admin@${process.env.UNIVERSITY_EMAIL_DOMAIN.trim()}`
            : null,
          password: password,
          role: AdminRoleEnum.ADMIN,
          faculty_id: faculty._id,
          department: department._id,
          created_by: superAdmin._id,
        });

        await newAdmin.save();
        created++;
      }
    }

  } catch (err) {
    console.error("❌ Error seeding faculty admins:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

seedFacultyAdmins();
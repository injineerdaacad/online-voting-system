import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  Department,
  Faculty,
  Admin,
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

const departmentsData = {
  SCI: ["Applied Chemistry", "Marine Biology", "Geology", "Mathematics", "Computer Science"],
  ENG: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"],
  EMS: ["Accounting", "Economics"],
  AES: ["Agronomy", "Environmental Science"],
  SOC: ["Political Science", "Social Work"],
  VAH: ["Veterinary Medicine", "Animal Husbandry"],
  MED: ["Medicine", "Nursing", "Surgery", "Pharmacy", "Public Health"],
  EDU: ["Biology and Chemistry Education", "Physics and Mathematics Education"],
  ISL: ["Quranic Studies", "Islamic Law", "Islamic History"],
  LAN: ["English", "Italian", "Arabic", "Somali"],
  LAW: ["Public Law", "Private Law", "Criminal Law"],
};

async function seedDepartments() {
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

    await Department.deleteMany({});
    const faculties = await Faculty.find();
    if (!faculties.length) {
      console.error("❌ Error: No faculties found. Please run seedFaculty.js first");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const faculty of faculties) {
      const facultyCode = faculty.code;
      const facultyDepartments = departmentsData[facultyCode] || [];

      for (const deptName of facultyDepartments) {
        const acronym = deptName
          .split(/\s+/)
          .map((w) => w.charAt(0))
          .join("")
          .toUpperCase();

        const baseCode = `${faculty.code}-${acronym}`.toUpperCase();

        const existingDept = await Department.findOne({ code: baseCode });
        if (existingDept) {
          const alreadyLinked = (faculty.departments || []).some(
            (id) => String(id) === String(existingDept._id)
          );
          if (!alreadyLinked) {
            faculty.departments.push(existingDept._id);
          }
          skipped++;
          continue;
        }

        const newDept = new Department({
          name: deptName,
          code: baseCode,
          faculty_id: faculty._id,
          created_by: adminUser._id,
        });

        await newDept.save();
        created++;

        const alreadyLinked = (faculty.departments || []).some(
          (id) => String(id) === String(newDept._id)
        );
        if (!alreadyLinked) {
          faculty.departments.push(newDept._id);
        }
      }

      await faculty.save();
    }

  } catch (err) {
    console.error("❌ Error seeding departments:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

seedDepartments();
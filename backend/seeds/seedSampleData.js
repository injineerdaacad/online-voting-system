// Sample data for showing the system (interview / presentation).
//
//   SAMPLE_ADMIN_PASSWORD=... SAMPLE_STUDENT_PASSWORD=... node seeds/seedSampleData.js
//       remove old sample data, then create it again
//   node seeds/seedSampleData.js --reset
//       only remove the sample data
//
// Passwords come from the environment only, never from this file (the repo
// is public). SAMPLE_STUDENT_PASSWORD must be 6 characters (app login rule).
//
// Creates, in the faculty of the first real student (or the first faculty):
//   - Students B3SC601..B3SC612 (they vote / stand as candidates)
//   - Tester students TEST01..TEST06 (never vote; for people trying the app)
//   - A Super Admin "admin" for the dashboard
//   - Election 1: Student Union, today 08:00-12:00   -> Closed, with results
//   - Election 2: Sports & Culture, now until Friday   -> Active, some votes
//   - Election 3: Faculty Leadership, all of Saturday  -> Upcoming until Saturday
//
// Only documents created here are removed on re-run: students matched by
// ID and name, the admin by username and email, elections by title. Times are Africa/Mogadishu (UTC+3).
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ensureDatabaseName } from "../config/dbConfig.js";
import { User } from "../models/userModel.js";
import { Election } from "../models/electionModel.js";
import { Candidate } from "../models/candidateModel.js";
import { Vote } from "../models/voteModel.js";
import { Faculty } from "../models/facultyModel.js";
import { Department } from "../models/departmentModel.js";

dotenv.config();

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@ovs.kalsooni.com";

const TITLES = {
  union: "SNU Student Union Election 2026",
  sports: "Sports & Culture Secretary By-Election",
  faculty: "Faculty of Science Leadership Election 2026",
};

const SAMPLE_STUDENTS = [
  "Abdirahman Hassan Ali", "Hodan Mohamed Abdi", "Mohamed Ali Farah",
  "Fadumo Ahmed Warsame", "Abdullahi Yusuf Omar", "Sahra Abdi Nur",
  "Ahmed Ismail Jama", "Ayaan Hussein Mohamud", "Omar Abdikadir Aden",
  "Ifrah Said Osman", "Yusuf Mahad Hirsi", "Maryan Ali Guled",
];
const TESTERS = 6;

// Mogadishu is UTC+3 all year (no DST)
const MOG_OFFSET_MS = 3 * 60 * 60 * 1000;
const mogDate = (base, addDays, hh, mm = 0) => {
  const local = new Date(base.getTime() + MOG_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(),
    local.getUTCDate() + addDays, hh - 3, mm));
};
const daysUntilSaturday = (base) => {
  const dow = new Date(base.getTime() + MOG_OFFSET_MS).getUTCDay(); // 0=Sun
  return (6 - dow + 7) % 7 || 7;
};

const sampleId = (i) => `B3SC${601 + i}`;
const testerId = (i) => `TEST${String(i + 1).padStart(2, "0")}`;
const testerName = (i) => `Test Student ${i + 1}`;
const seededStudents = () => [
  ...SAMPLE_STUDENTS.map((name, i) => ({ student_id: sampleId(i), full_name: name })),
  ...Array.from({ length: TESTERS }, (_, i) => ({ student_id: testerId(i), full_name: testerName(i) })),
];
const studentIds = () => seededStudents().map((s) => s.student_id);

async function removeSampleData() {
  const elections = await Election.find({ title: { $in: Object.values(TITLES) } }).select("_id");
  const electionIds = elections.map((e) => e._id);
  const votes = await Vote.deleteMany({ election_id: { $in: electionIds } });
  const candidates = await Candidate.deleteMany({ election_id: { $in: electionIds } });
  await User.updateMany(
    { "has_voted.election_id": { $in: electionIds } },
    { $pull: { has_voted: { election_id: { $in: electionIds } } } }
  );
  const removedElections = await Election.deleteMany({ _id: { $in: electionIds } });
  const users = await User.deleteMany({
    $or: [
      ...seededStudents().map((s) => ({ role: "Student", ...s })),
      { username: ADMIN_USERNAME, email: ADMIN_EMAIL },
    ],
  });
  console.log(`Removed: ${removedElections.deletedCount} elections, ${candidates.deletedCount} candidates, ` +
    `${votes.deletedCount} votes, ${users.deletedCount} users`);
}

async function pickFacultyAndDepartments() {
  const realStudent = await User.findOne({ role: "Student", student_id: { $nin: studentIds() } });
  const faculty = realStudent
    ? await Faculty.findById(realStudent.faculty_id)
    : await Faculty.findOne();
  if (!faculty) throw new Error("No faculty found. Run the faculty/department seeds first.");
  const departments = await Department.find({ faculty_id: faculty._id });
  if (!departments.length) throw new Error(`Faculty ${faculty.name} has no departments.`);
  return { faculty, departments };
}

async function createStudent(student_id, full_name, faculty, department, superAdmin, password) {
  const user = new User({
    student_id,
    full_name,
    password,
    role: "Student",
    status: "Active",
    faculty_id: faculty._id,
    department: department._id,
    batch: "Batch3",
    graduation_year: 2027,
    created_by: superAdmin?._id,
  });
  await user.save();
  return user;
}

async function addCandidates(election, positions, superAdmin) {
  const byPosition = {};
  for (const [position, entries] of Object.entries(positions)) {
    byPosition[position] = [];
    for (const { student, manifesto } of entries) {
      const c = await Candidate.create({
        student_id: student._id,
        election_id: election._id,
        position,
        manifesto,
        created_by: superAdmin._id,
      });
      byPosition[position].push(c);
    }
  }
  return byPosition;
}

// picks[i] = index of the chosen candidate per position for voter i
async function castVotes(election, byPosition, voters, picks, castAt) {
  const positions = Object.keys(byPosition);
  for (let i = 0; i < voters.length; i++) {
    const votes = positions.map((position, p) => ({
      candidate_id: byPosition[position][picks[i][p]]._id,
      position,
    }));
    const at = new Date(castAt.getTime() + i * 7 * 60 * 1000);
    await Vote.create({ election_id: election._id, voter_id: voters[i]._id, votes, cast_at: at });
    await User.updateOne(
      { _id: voters[i]._id },
      { $addToSet: { has_voted: { election_id: election._id, voted_at: at } } }
    );
  }
}

async function seed() {
  const ADMIN_PASSWORD = process.env.SAMPLE_ADMIN_PASSWORD;
  const STUDENT_PASSWORD = process.env.SAMPLE_STUDENT_PASSWORD;
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error("Set SAMPLE_ADMIN_PASSWORD (at least 8 characters).");
  }
  if (!STUDENT_PASSWORD || STUDENT_PASSWORD.length !== 6) {
    throw new Error("Set SAMPLE_STUDENT_PASSWORD (exactly 6 characters).");
  }
  const superAdmin = await User.findOne({ role: "Super Admin", username: { $ne: ADMIN_USERNAME } });
  if (!superAdmin) throw new Error("No Super Admin found. Run seeds/seedSuperAdmin.js first.");
  const { faculty, departments } = await pickFacultyAndDepartments();
  console.log(`Faculty: ${faculty.name} (${departments.length} departments)`);

  const taken = await User.findOne({
    $or: [{ student_id: { $in: studentIds() } }, { username: ADMIN_USERNAME }],
  });
  if (taken) {
    throw new Error(`"${taken.student_id || taken.username}" already exists and was not created by this script.`);
  }

  const students = [];
  for (let i = 0; i < SAMPLE_STUDENTS.length; i++) {
    students.push(await createStudent(sampleId(i), SAMPLE_STUDENTS[i],
      faculty, departments[i % departments.length], superAdmin, STUDENT_PASSWORD));
  }
  for (let i = 0; i < TESTERS; i++) {
    await createStudent(testerId(i), testerName(i),
      faculty, departments[i % departments.length], superAdmin, STUDENT_PASSWORD);
  }

  const admin = new User({
    username: ADMIN_USERNAME,
    full_name: "Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "Super Admin",
    status: "Active",
  });
  await admin.save();

  const now = new Date();
  const sat = daysUntilSaturday(now);

  // 1) Closed today, with results
  let unionStart = mogDate(now, 0, 8);
  let unionEnd = mogDate(now, 0, 12);
  if (unionEnd > now) { unionStart = mogDate(now, -1, 8); unionEnd = mogDate(now, -1, 12); }
  const union = await Election.create({
    title: TITLES.union,
    description: "University-wide election for the Student Union executive committee.",
    type: "Student Union Election",
    start_time: unionStart, end_time: unionEnd, status: "Closed",
    created_by: superAdmin._id,
  });
  const unionCands = await addCandidates(union, {
    President: [
      { student: students[0], manifesto: "Transparent student budget and a 24/7 library." },
      { student: students[1], manifesto: "More internships through partnerships with local companies." },
      { student: students[2], manifesto: "Better campus Wi-Fi and online course materials." },
    ],
    "Vice President": [
      { student: students[3], manifesto: "A student support desk in every faculty." },
      { student: students[4], manifesto: "Monthly town halls between students and administration." },
    ],
    Secretary: [
      { student: students[5], manifesto: "Publish every Student Union decision online." },
      { student: students[6], manifesto: "Faster replies to student complaints." },
    ],
  }, superAdmin);
  await castVotes(union, unionCands, students.slice(0, 11), [
    [1, 0, 0], [1, 1, 0], [0, 0, 1], [1, 0, 0], [2, 1, 0], [1, 0, 1],
    [0, 0, 0], [1, 1, 0], [2, 0, 1], [1, 0, 0], [0, 1, 0],
  ], new Date(unionStart.getTime() + 20 * 60 * 1000));

  // 2) Active now until Friday 23:59, some votes already cast
  const sports = await Election.create({
    title: TITLES.sports,
    description: "By-election for the Student Union Sports & Culture Secretary.",
    type: "Student Union Election",
    start_time: new Date(now.getTime() - 60 * 60 * 1000),
    end_time: mogDate(now, sat - 1, 23, 59),
    status: "Active",
    created_by: superAdmin._id,
  });
  const sportsCands = await addCandidates(sports, {
    "Sports & Culture Secretary": [
      { student: students[7], manifesto: "An inter-faculty football league every semester." },
      { student: students[8], manifesto: "A yearly Somali culture and poetry festival." },
    ],
  }, superAdmin);
  await castVotes(sports, sportsCands, students.slice(0, 5), [[0], [1], [0], [0], [1]],
    new Date(now.getTime() - 50 * 60 * 1000));

  // 3) Saturday 08:00-23:59: Upcoming until then, Active all Saturday
  const facultyElection = await Election.create({
    title: TITLES.faculty,
    description: `Leadership election for the ${faculty.name}.`,
    type: "Faculty Leadership Election",
    faculty_id: faculty._id,
    start_time: mogDate(now, sat, 8),
    end_time: mogDate(now, sat, 23, 59),
    status: "Upcoming",
    created_by: superAdmin._id,
  });
  await addCandidates(facultyElection, {
    "Faculty Representative": [
      { student: students[9], manifesto: "Modern lab equipment for every department." },
      { student: students[10], manifesto: "Peer tutoring for first-year students." },
      { student: students[11], manifesto: "A faculty research day with industry guests." },
    ],
  }, superAdmin);

  console.log(`Created ${students.length} students, ${TESTERS} testers, admin "${ADMIN_USERNAME}", 3 elections`);
  console.log(`  ${TITLES.union}: Closed (${unionStart.toISOString()} - ${unionEnd.toISOString()})`);
  console.log(`  ${TITLES.sports}: Active until ${sports.end_time.toISOString()}`);
  console.log(`  ${TITLES.faculty}: ${facultyElection.start_time.toISOString()} - ${facultyElection.end_time.toISOString()}`);
}

const run = async () => {
  const uri = ensureDatabaseName(process.env.MONGODB_URI || process.env.DB);
  await mongoose.connect(uri, { dbName: process.env.DB_NAME, serverSelectionTimeoutMS: 15000 });
  try {
    await removeSampleData();
    if (!process.argv.includes("--reset")) await seed();
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error("❌ Sample data seed failed:", err.message);
  process.exit(1);
});

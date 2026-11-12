// Demo data for showing the system (interview / presentation).
//
//   node seeds/seedDemo.js          remove old demo data, then create it again
//   node seeds/seedDemo.js --reset  only remove the demo data
//
// Creates, in the faculty of the first real student (or the first faculty):
//   - Demo students DEMO001..DEMO012 (they vote / stand as candidates)
//   - Tester students TEST01..TEST06 (never vote; for people trying the app)
//   - A demo Super Admin "demo.admin" for the dashboard
//   - Election 1: Student Union, today 08:00-12:00   -> Closed, with results
//   - Election 2: Sports & Culture, now until Friday   -> Active, some votes
//   - Election 3: Faculty Leadership, all of Saturday  -> Upcoming until Saturday
//
// Only documents created here are removed on re-run (matched by the IDs,
// username and election titles below). Times are Africa/Mogadishu (UTC+3).
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

const STUDENT_PASSWORD = "vote26";
const ADMIN_USERNAME = "demo.admin";
const ADMIN_PASSWORD = "Demo@2026";

const TITLES = {
  union: "SNU Student Union Election 2026",
  sports: "Sports & Culture Secretary By-Election",
  faculty: "Faculty of Science Leadership Election 2026",
};

const DEMO_STUDENTS = [
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

const studentIds = () => [
  ...DEMO_STUDENTS.map((_, i) => `DEMO${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: TESTERS }, (_, i) => `TEST${String(i + 1).padStart(2, "0")}`),
];

async function removeDemo() {
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
    $or: [{ student_id: { $in: studentIds() } }, { username: ADMIN_USERNAME }],
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

async function createStudent(student_id, full_name, faculty, department, superAdmin) {
  const user = new User({
    student_id,
    full_name,
    password: STUDENT_PASSWORD,
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
  const superAdmin = await User.findOne({ role: "Super Admin", username: { $ne: ADMIN_USERNAME } });
  if (!superAdmin) throw new Error("No Super Admin found. Run seeds/seedSuperAdmin.js first.");
  const { faculty, departments } = await pickFacultyAndDepartments();
  console.log(`Faculty: ${faculty.name} (${departments.length} departments)`);

  const demo = [];
  for (let i = 0; i < DEMO_STUDENTS.length; i++) {
    demo.push(await createStudent(`DEMO${String(i + 1).padStart(3, "0")}`, DEMO_STUDENTS[i],
      faculty, departments[i % departments.length], superAdmin));
  }
  for (let i = 1; i <= TESTERS; i++) {
    await createStudent(`TEST${String(i).padStart(2, "0")}`, `Test Student ${i}`,
      faculty, departments[(i - 1) % departments.length], superAdmin);
  }

  const admin = new User({
    username: ADMIN_USERNAME,
    full_name: "Demo Admin",
    email: "demo.admin@example.com",
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
      { student: demo[0], manifesto: "Transparent student budget and a 24/7 library." },
      { student: demo[1], manifesto: "More internships through partnerships with local companies." },
      { student: demo[2], manifesto: "Better campus Wi-Fi and online course materials." },
    ],
    "Vice President": [
      { student: demo[3], manifesto: "A student support desk in every faculty." },
      { student: demo[4], manifesto: "Monthly town halls between students and administration." },
    ],
    Secretary: [
      { student: demo[5], manifesto: "Publish every Student Union decision online." },
      { student: demo[6], manifesto: "Faster replies to student complaints." },
    ],
  }, superAdmin);
  await castVotes(union, unionCands, demo.slice(0, 11), [
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
      { student: demo[7], manifesto: "An inter-faculty football league every semester." },
      { student: demo[8], manifesto: "A yearly Somali culture and poetry festival." },
    ],
  }, superAdmin);
  await castVotes(sports, sportsCands, demo.slice(0, 5), [[0], [1], [0], [0], [1]],
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
      { student: demo[9], manifesto: "Modern lab equipment for every department." },
      { student: demo[10], manifesto: "Peer tutoring for first-year students." },
      { student: demo[11], manifesto: "A faculty research day with industry guests." },
    ],
  }, superAdmin);

  console.log(`Created ${demo.length} demo students, ${TESTERS} testers, admin "${ADMIN_USERNAME}", 3 elections`);
  console.log(`  ${TITLES.union}: Closed (${unionStart.toISOString()} - ${unionEnd.toISOString()})`);
  console.log(`  ${TITLES.sports}: Active until ${sports.end_time.toISOString()}`);
  console.log(`  ${TITLES.faculty}: ${facultyElection.start_time.toISOString()} - ${facultyElection.end_time.toISOString()}`);
}

const run = async () => {
  const uri = ensureDatabaseName(process.env.MONGODB_URI || process.env.DB);
  await mongoose.connect(uri, { dbName: process.env.DB_NAME, serverSelectionTimeoutMS: 15000 });
  try {
    await removeDemo();
    if (!process.argv.includes("--reset")) await seed();
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error("❌ Demo seed failed:", err.message);
  process.exit(1);
});

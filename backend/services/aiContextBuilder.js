import {
  Election,
  Candidate,
  Vote,
  User,
  ElectionStatusEnum,
  ElectionTypeEnum,
  StudentStatusEnum,
} from "../models/index.js";
import {
  computeElectionStatus,
  formatDateInTimeZone,
  DEFAULT_TIMEZONE,
} from "../utils/formatters.js";
import mongoose from "mongoose";

const MAX_ELECTIONS = 10;
const MAX_CANDIDATES = 200;
const MANIFESTO_MAX_LENGTH = 450;

const RULES_SUMMARY = {
  so: `Qawaaniinta doorashada: Hal cod oo keliya per doorasho. Wakhtiga codeynta waa wakhtiga furan ee doorashada. Ma codeyn karto haddii aad horey u codeysay doorashadan. Natiijooyinka waxaa laga arki karaa marka doorashadu xirantahay ama admin ku dhaqangeliyay.`,
  en: `Election rules: One vote per election. Voting window is the election's open period. You cannot vote if you already voted in this election. Results are visible when the election is closed or when admin has published them.`,
};

async function getVisibleElections(studentId, facultyId) {
  const student = await User.findById(studentId)
    .select("status faculty_id")
    .lean();
  if (!student || student.status !== StudentStatusEnum.ACTIVE) return [];

  const query = {
    $or: [
      { type: ElectionTypeEnum.STUDENT_UNION_ELECTION },
      {
        type: ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION,
        faculty_id: student.faculty_id,
      },
    ],
    status: { $ne: "Inactive" },
  };

  const elections = await Election.find(query)
    .select("title description type status start_time end_time faculty_id")
    .populate("faculty_id", "name code")
    .sort({ start_time: -1 })
    .limit(MAX_ELECTIONS)
    .lean();

  const now = new Date();
  const out = elections.map((e) => {
    const resolvedStatus = computeElectionStatus(
      e,
      ElectionStatusEnum,
      DEFAULT_TIMEZONE
    );
    const startFormatted = formatDateInTimeZone(
      e.start_time,
      DEFAULT_TIMEZONE
    );
    const endFormatted = formatDateInTimeZone(e.end_time, DEFAULT_TIMEZONE);
    return {
      _id: e._id.toString(),
      title: e.title,
      description: e.description || null,
      type: e.type,
      status: resolvedStatus,
      start_time: startFormatted,
      end_time: endFormatted,
      faculty: e.faculty_id ? e.faculty_id.name : null,
      faculty_code: e.faculty_id ? e.faculty_id.code : null,
    };
  });
  return out;
}

async function getCandidatesForElections(electionIds) {
  if (!electionIds || electionIds.length === 0) return [];

  const candidates = await Candidate.find({
    election_id: { $in: electionIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .populate("student_id", "full_name photo_url")
    .limit(MAX_CANDIDATES)
    .lean();

  return candidates.map((c) => {
    const manifesto = c.manifesto
      ? String(c.manifesto).slice(0, MANIFESTO_MAX_LENGTH) +
        (c.manifesto.length > MANIFESTO_MAX_LENGTH ? "…" : "")
      : null;
    return {
      election_id: c.election_id?.toString(),
      position: c.position,
      name: c.student_id?.full_name || "—",
      manifesto,
      photo_url: c.student_id?.photo_url || null,
    };
  });
}

async function getHasVoted(studentId, electionIds) {
  if (!electionIds || electionIds.length === 0) return {};
  const votes = await Vote.find({
    voter_id: new mongoose.Types.ObjectId(studentId),
    election_id: { $in: electionIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("election_id")
    .lean();
  const map = {};
  votes.forEach((v) => {
    map[v.election_id.toString()] = true;
  });
  return map;
}

export async function buildAssistantContext(studentId, facultyId, language = "so") {
  const elections = await getVisibleElections(studentId, facultyId);
  const electionIds = elections.map((e) => e._id);
  const [candidates, hasVoted] = await Promise.all([
    getCandidatesForElections(electionIds),
    getHasVoted(studentId, electionIds),
  ]);

  const rulesSummary =
    language === "en" ? RULES_SUMMARY.en : RULES_SUMMARY.so;

  return {
    elections,
    candidates,
    rulesSummary,
    hasVoted,
    language,
  };
}
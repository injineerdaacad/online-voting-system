import mongoose from "mongoose";
import {
  Student,
  Election,
  Candidate,
  Vote,
  ElectionStatusEnum,
  Admin,
  UserRoleEnum,
  ElectionTypeEnum,
  StudentStatusEnum,
} from "../models/index.js";
import {
  formatDateInTimeZone,
  DEFAULT_TIMEZONE,
  computeElectionStatus,
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const getElectionResults = async (req, res) => {
  const { electionId } = req.params;

  try {
    ensureValidObjectId(electionId, "election id");

    const election = await Election.findById(electionId);
    assertCondition(election, 404, "Election not found");

    const isStudent = req.user.role === UserRoleEnum.STUDENT;

    if (!isSuperAdmin(req.user)) {
      if (isStudent) {
        const student = await Student.findById(req.user.id);
        assertCondition(student, 404, "Student not found");

        const isEligible =
          student.status === StudentStatusEnum.ACTIVE && (
            election.type === ElectionTypeEnum.STUDENT_UNION_ELECTION ||
            (election.type === ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION &&
             election.faculty_id &&
             election.faculty_id.toString() === student.faculty_id?.toString())
          );

        assertCondition(
          isEligible,
          403,
          "Access denied - You are not eligible for this election"
        );
      } else {
        assertCondition(
          election.faculty_id,
          403,
          "Access denied - Election must be assigned to a faculty"
        );

        let userFacultyId = req.user.faculty_id;
        if (!userFacultyId && req.user.id) {
          const user = await Admin.findById(req.user.id).select('faculty_id');
          if (user && user.faculty_id) {
            userFacultyId = user.faculty_id;
          }
        }

        assertCondition(
          userFacultyId,
          403,
          "Access denied - You must be assigned to a faculty"
        );

        const electionFacultyId = election.faculty_id.toString();

        let userFacultyIdString;
        if (typeof userFacultyId === 'string') {
          userFacultyIdString = userFacultyId;
        } else if (userFacultyId && userFacultyId.toString) {
          userFacultyIdString = userFacultyId.toString();
        } else if (userFacultyId && userFacultyId._id) {
          userFacultyIdString = userFacultyId._id.toString();
        } else {
          throw new Error("Invalid faculty_id format");
        }

        assertCondition(
          electionFacultyId === userFacultyIdString,
          403,
          "Access denied - You can only view results for your faculty elections"
        );
      }
    }

    const resolvedStatus = computeElectionStatus(
      election,
      ElectionStatusEnum,
      DEFAULT_TIMEZONE
    );

    const candidates = await Candidate.find({ election_id: electionId }).lean();

    const voteCounts = await Vote.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(electionId) } },
      { $unwind: "$votes" },
      {
        $group: {
          _id: "$votes.candidate_id",
          vote_count: { $sum: 1 },
        },
      },
    ]);

    const voteCountMap = {};
    voteCounts.forEach((vc) => {
      voteCountMap[vc._id.toString()] = vc.vote_count;
    });

    const studentIds = candidates.map((c) => c.student_id);
    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    const studentMap = {};
    students.forEach((s) => {
      studentMap[s._id.toString()] = s;
    });

    const formattedResults = candidates.map((c) => ({
      candidate_id: c._id,
      position: c.position,
      manifesto: c.manifesto,
      photo_url: studentMap[c.student_id.toString()]?.photo_url || null,
      vote_count: voteCountMap[c._id.toString()] || 0,
      student: studentMap[c.student_id.toString()]
        ? {
            id: studentMap[c.student_id.toString()]._id,
            full_name: studentMap[c.student_id.toString()].full_name,
            status: studentMap[c.student_id.toString()].status,
            faculty_id: studentMap[c.student_id.toString()].faculty_id,
            photo_url: studentMap[c.student_id.toString()].photo_url,
          }
        : {},
      created_at: formatDateInTimeZone(c.created_at, DEFAULT_TIMEZONE),
      updated_at: formatDateInTimeZone(c.updated_at, DEFAULT_TIMEZONE),
    }));

    formattedResults.sort((a, b) => b.vote_count - a.vote_count);

    const total_votes = formattedResults.reduce((sum, r) => sum + r.vote_count, 0);
    const resultsWithPercentage = formattedResults.map((r, index) => ({
      ...r,
      rank: index + 1,
      percentage: total_votes > 0 ? (r.vote_count / total_votes) * 100 : 0,
      candidate_name: r.student?.full_name || "Unknown",
    }));

    res.json({
      election: {
        id: election._id,
        title: election.title,
        type: election.type,
        status: resolvedStatus,
        start_time: formatDateInTimeZone(
          election.start_time,
          DEFAULT_TIMEZONE
        ),
        end_time: formatDateInTimeZone(election.end_time, DEFAULT_TIMEZONE),
        created_at: formatDateInTimeZone(election.created_at, DEFAULT_TIMEZONE),
        updated_at: formatDateInTimeZone(election.updated_at, DEFAULT_TIMEZONE),
      },
      results: resultsWithPercentage,
      total_votes: total_votes,
    });

  } catch (err) {
    return handleControllerError(res, err, "Failed to get election results");
  }
};
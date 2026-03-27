import mongoose from "mongoose";
import {
  Student,
  StudentStatusEnum,
  Election,
  ElectionTypeEnum,
  Candidate,
  Vote,
} from "../models/index.js";
import {
  assertCondition,
  ensureValidObjectId,
  ensureValidObjectIds,
  handleControllerError,
} from "../utils/controllerHelpers.js";
import { io } from "../config/socketConfig.js";

export const voteForCandidate = async (req, res) => {
  try {
    const { candidate_ids, election_id } = req.body;
    const studentId = req.user.id;

    if (!candidate_ids || !election_id) {
      console.error("❌ Missing required fields:", {
        hasCandidateIds: !!candidate_ids,
        hasElectionId: !!election_id,
        bodyKeys: Object.keys(req.body),
      });
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          candidate_ids: candidate_ids ? "present" : "missing",
          election_id: election_id ? "present" : "missing",
          receivedKeys: Object.keys(req.body),
        },
      });
    }

    assertCondition(
      Array.isArray(candidate_ids) && candidate_ids.length === 2,
      400,
      "You must vote for exactly two candidates"
    );

    assertCondition(
      new Set(candidate_ids).size === 2,
      400,
      "You cannot vote for the same candidate twice"
    );

    ensureValidObjectId(election_id, "election_id");
    ensureValidObjectIds(candidate_ids, "candidate_ids");

    const electionObjectId = new mongoose.Types.ObjectId(election_id);
    const candidateObjectIds = candidate_ids.map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    const student = await Student.findById(studentObjectId).lean();
    assertCondition(student, 404, "Student not found");

    const election = await Election.findById(electionObjectId).lean();
    assertCondition(election, 404, "Election not found");

    assertCondition(
      student.status === StudentStatusEnum.ACTIVE,
      403,
      "Only active students can vote in this election"
    );

    if (election.type === ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION) {
      assertCondition(
        election.faculty_id &&
          student.faculty_id &&
          student.faculty_id.toString() === election.faculty_id.toString(),
        403,
        "You can only vote in elections for your own faculty"
      );
    }

    const now = new Date();
    assertCondition(
      now >= new Date(election.start_time) && now <= new Date(election.end_time),
      400,
      "Voting not allowed at this time"
    );

    const alreadyVoted =
      Array.isArray(student.has_voted) &&
      student.has_voted.some(
        (v) =>
          (v.election_id?._id?.toString?.() || v.election_id?.toString?.()) ===
          electionObjectId.toString()
      );

    assertCondition(!alreadyVoted, 400, "You have already voted in this election");

    const candidates = await Candidate.find({
      _id: { $in: candidateObjectIds },
      election_id: electionObjectId,
    }).lean();

    assertCondition(
      candidates.length === 2,
      400,
      "Invalid candidate(s) for this election"
    );

    const positions = candidates.map((c) => c.position?.trim());

    assertCondition(
      positions.every(Boolean),
      400,
      "Candidate position missing"
    );

    assertCondition(
      new Set(positions).size === positions.length,
      400,
      "You cannot vote for more than one candidate in the same position"
    );

    assertCondition(
      positions.length === 2,
      400,
      "You must vote for exactly 2 candidates (one for each position)"
    );

    assertCondition(
      new Set(positions).size === 2,
      400,
      "You must vote for candidates from 2 different positions"
    );

    const existingVote = await Vote.findOne({
      voter_id: studentObjectId,
      election_id: electionObjectId
    }).lean();

    assertCondition(
      !existingVote,
      400,
      "Waxaad hore u codeysay, mar labaad ma codeyn kartid"
    );

    const votesArray = candidates.map((c) => ({
      candidate_id: c._id,
      position: c.position.trim()
    }));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingVoteInTransaction = await Vote.findOne({
        voter_id: studentObjectId,
        election_id: electionObjectId
      })
        .session(session)
        .lean();

      if (existingVoteInTransaction) {
        console.error("❌ Duplicate vote detected in transaction:", {
          voterId: studentObjectId.toString(),
          electionId: electionObjectId.toString(),
          attemptedPositions: positions,
        });
        await session.abortTransaction();
        return res.status(400).json({
          error: "Waxaad hore u codeysay, mar labaad ma codeyn kartid"
        });
      }

      await Vote.create([{
        voter_id: studentObjectId,
        election_id: electionObjectId,
        votes: votesArray
      }], { session });

      await Student.findByIdAndUpdate(
        studentObjectId,
        {
          $addToSet: { has_voted: { election_id: electionObjectId, voted_at: new Date() } },
        },
        { session }
      );

      await session.commitTransaction();
    } catch (insertError) {
      await session.abortTransaction();
      throw insertError;
    } finally {
      session.endSession();
    }

    if (io) {
      try {
        const candidateIds = candidates.map(c => c.student_id);
        const candidateStudents = await Student.find({ _id: { $in: candidateIds } }).lean();
        const studentMap = {};
        candidateStudents.forEach(s => {
          studentMap[s._id.toString()] = s;
        });

        candidates.forEach((candidate) => {
          const candidateStudent = studentMap[candidate.student_id.toString()];
          if (candidateStudent) {
            io.to(`election-${electionObjectId}`).emit('vote_cast', {
              electionId: electionObjectId.toString(),
              electionTitle: election.title,
              candidateId: candidate._id.toString(),
              candidateName: candidateStudent.full_name,
              position: candidate.position,
              voterId: studentObjectId.toString(),
              voterName: student.full_name,
              timestamp: new Date().toISOString(),
            });
          }
        });

        const voteCounts = await Vote.aggregate([
          { $match: { election_id: electionObjectId } },
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

        const allCandidates = await Candidate.find({ election_id: electionObjectId }).lean();
        const allStudentIds = allCandidates.map(c => c.student_id);
        const allCandidateStudents = await Student.find({ _id: { $in: allStudentIds } }).lean();
        const allStudentMap = {};
        allCandidateStudents.forEach(s => {
          allStudentMap[s._id.toString()] = s;
        });

        const totalVotes = voteCounts.reduce((sum, vc) => sum + vc.vote_count, 0);

        const results = allCandidates.map((c) => {
          const candidateStudent = allStudentMap[c.student_id.toString()];
          return {
            candidateId: c._id.toString(),
            candidateName: candidateStudent?.full_name || "Unknown",
            votes: voteCountMap[c._id.toString()] || 0,
            percentage: totalVotes > 0 ? ((voteCountMap[c._id.toString()] || 0) / totalVotes) * 100 : 0,
          };
        });

        io.to(`election-${electionObjectId}`).emit('election_results_update', {
          electionId: electionObjectId.toString(),
          electionTitle: election.title,
          results: results.sort((a, b) => b.votes - a.votes),
          totalVotes,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        console.error("⚠️ Socket emission error (vote still successful):", {
          error: socketError.message,
          stack: socketError.stack,
          electionId: electionObjectId.toString(),
        });
      }
    }

    res.status(201).json({ message: "Votes cast successfully" });

  } catch (err) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      console.error("❌ MongoDB Duplicate Key Error:", {
        code: err.code,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue,
        message: err.message,
        stack: err.stack,
        voterId: req.user?.id,
        electionId: req.body?.election_id,
        candidateIds: req.body?.candidate_ids,
        keyValuePosition: err.keyValue?.position,
        keyValueVoterId: err.keyValue?.voter_id,
        keyValueElectionId: err.keyValue?.election_id,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      });

      let existingVoteDetails = null;
      let position = 'unknown position';

      try {
        const voterId = err.keyValue?.voter_id
          ? new mongoose.Types.ObjectId(err.keyValue.voter_id)
          : (req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null);
        const electionId = err.keyValue?.election_id
          ? new mongoose.Types.ObjectId(err.keyValue.election_id)
          : (req.body?.election_id ? new mongoose.Types.ObjectId(req.body.election_id) : null);

        if (voterId && electionId) {
          const existingVote = await Vote.findOne({
            voter_id: voterId,
            election_id: electionId,
          })
            .select('votes cast_at created_at')
            .lean();

          if (existingVote && existingVote.votes && existingVote.votes.length > 0) {
            const existingPositions = existingVote.votes
              .map(v => v.position)
              .filter(p => p && p.trim() !== '')
              .filter((p, i, arr) => arr.indexOf(p) === i);

            if (existingPositions.length > 0) {
              position = existingPositions.join(', ');
              existingVoteDetails = {
                position: position,
                positions: existingPositions,
                voteCount: existingVote.votes.length,
                candidateIds: existingVote.votes.map(v => v.candidate_id?.toString()),
                votedAt: existingVote.cast_at || existingVote.created_at,
              };
            } else {
              position = 'one or more positions (data integrity issue detected)';
              existingVoteDetails = {
                position: 'null/empty',
                voteCount: existingVote.votes.length,
                candidateIds: existingVote.votes.map(v => v.candidate_id?.toString()),
                warning: 'Existing vote has null or empty positions in votes array',
              };
            }
          } else if (!position || position === 'unknown position') {
            if (req.body?.candidate_ids) {
              const attemptedCandidates = await Candidate.find({
                _id: { $in: req.body.candidate_ids.map(id => new mongoose.Types.ObjectId(id)) },
                election_id: electionId
              }).select('position').lean();

              if (attemptedCandidates.length > 0) {
                const attemptedPositions = attemptedCandidates
                  .map(c => c.position)
                  .filter(p => p && p.trim() !== '')
                  .filter((p, i, arr) => arr.indexOf(p) === i);

                if (attemptedPositions.length > 0) {
                  position = attemptedPositions.join(', ');
                }
              }
            }
          }
        }
      } catch (lookupError) {
        console.error("⚠️ Error looking up existing vote:", {
          error: lookupError.message,
          stack: lookupError.stack,
          keyValue: err.keyValue,
        });
      }

      const duplicateField = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'unknown';

      let errorMessage = 'Duplicate vote detected.';
      if (position && position !== 'unknown position') {
        if (position.includes(',')) {
          errorMessage = `You have already voted for these positions: ${position}`;
        } else {
          errorMessage = `You have already voted for this position: ${position}`;
        }
      } else {
        errorMessage = 'You have already voted in this election.';
      }

      return res.status(409).json({
        error: errorMessage,
        message: errorMessage,
        details: isDevelopment ? {
          duplicateField,
          position,
          keyValue: err.keyValue,
          existingVote: existingVoteDetails,
          mongoError: err.message,
        } : undefined,
      });
    }

    if (err.name === 'ValidationError') {
      console.error("❌ Mongoose Validation Error:", {
        errors: err.errors,
        message: err.message,
      });
      return res.status(400).json({
        error: "Validation failed",
        details: isDevelopment ? Object.keys(err.errors || {}).map(key => ({
          field: key,
          message: err.errors[key].message,
        })) : undefined,
      });
    }

    if (err.statusCode && err.statusCode !== 500) {
      console.error("❌ Vote Controller Validation Error:", {
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
      });
      return res.status(err.statusCode).json({
        error: err.message,
        details: isDevelopment ? err.details : undefined,
      });
    }

    let errorDetails = null;
    try {
      errorDetails = {
        message: err?.message || String(err),
        statusCode: err?.statusCode,
        name: err?.name,
        code: err?.code,
        body: req.body,
        userId: req.user?.id,
        stack: err?.stack,

        ...(err && typeof err === 'object' ? Object.getOwnPropertyNames(err).reduce((acc, key) => {
          try {
            acc[key] = err[key];
          } catch (e) {
            acc[key] = '[Unable to serialize]';
          }
          return acc;
        }, {}) : {}),
      };

      console.error("❌ Vote Controller Error (FULL DETAILS):");
      console.error(JSON.stringify(errorDetails, null, 2));
      console.error("❌ Raw Error Object:", err);
    } catch (logError) {
      console.error("❌ Vote Controller Error (SERIALIZATION FAILED):");
      console.error("Error message:", err?.message || String(err));
      console.error("Error type:", typeof err);
      console.error("Log error:", logError);

      errorDetails = {
        message: err?.message || String(err),
        serializationFailed: true,
      };
    }

    if (isDevelopment) {
      return res.status(err.statusCode || 500).json({
        error: err.message || "Failed to cast vote",
        details: errorDetails || { message: err?.message || "Unknown error" },
        stack: err.stack,
      });
    }

    return handleControllerError(res, err, "Failed to cast vote");
  }
};
import mongoose from "mongoose";
import {
  Student,
  StudentStatusEnum,
  ElectionStatusEnum,
  Election,
  ElectionTypeEnum,
  Candidate,
  Vote,
  AdminRoleEnum,
} from "../models/index.js";
import {
  formatDateTime,
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
  normalizeString,
} from "../utils/controllerHelpers.js";

export const addCandidate = async (req, res) => {
  try {
    const { student_id, election_id, position, manifesto } = req.body;

    const admin = req.user;

    ensureValidObjectId(student_id, "student_id");
    ensureValidObjectId(election_id, "election_id");

    const student = await Student.findById(student_id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const election = await Election.findById(election_id);
    if (!election) return res.status(404).json({ error: "Election not found" });

    if (!isSuperAdmin(admin)) {
      assertCondition(
        student.faculty_id &&
          admin.faculty_id &&
          student.faculty_id.toString() === admin.faculty_id.toString(),
        403,
        "You can only nominate students from your own Faculty"
      );

      assertCondition(
        election.type !== ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION ||
          (election.faculty_id &&
            admin.faculty_id &&
            election.faculty_id.toString() === admin.faculty_id.toString()),
        403,
        "You can only add candidates to your own Faculty elections"
      );
    }

    assertCondition(
      election.type !== ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION ||
        (student.faculty_id &&
          election.faculty_id &&
          student.faculty_id.toString() === election.faculty_id.toString()),
      403,
      "Student can only be a candidate for their own Faculty election"
    );

    assertCondition(
      student.status === StudentStatusEnum.ACTIVE,
      400,
      "Only active students can be candidates in this election"
    );

    const existingCandidate = await Candidate.findOne({
      student_id,
      election_id,
    });

    assertCondition(
      !existingCandidate,
      400,
      "Student is already a candidate in this Election"
    );

    const candidate = new Candidate({
      student_id,
      election_id,
      position: position ? normalizeString(position) : position,
      manifesto: manifesto ? normalizeString(manifesto) : manifesto,
      created_by: req.user.id,
    });

    await candidate.save();

    const populatedCandidate = await candidate
      .populate({
        path: "student_id",
        select: "full_name faculty_id status photo_url",
      });

    const candidateResponse = populatedCandidate.toObject();
    candidateResponse.photo_url = candidateResponse.student_id?.photo_url || null;

    res
      .status(201)
      .json({ message: "Candidate added", candidate: candidateResponse });

  } catch (err) {
    return handleControllerError(res, err, "Server error");
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()

      .populate({
        path: "election_id",
        populate: { path: "faculty_id", select: "name code" },
      })

      .populate({
        path: "student_id",
        select: "full_name faculty_id status photo_url",
        populate: { path: "faculty_id", select: "name code" },
      })

      .populate("created_by", "username email role");

    const filtered =
      req.user.role === AdminRoleEnum.SUPER_ADMIN
        ? candidates
        : candidates.filter(
            (c) =>
              c.student_id &&
              c.student_id.faculty_id &&
              c.student_id.faculty_id._id?.toString() === req.user.faculty_id?.toString()
          );

    const voteCounts = await Vote.aggregate([
      { $unwind: "$votes" },
      { $group: { _id: "$votes.candidate_id", vote_count: { $sum: 1 } } },
    ]);

    const voteMap = Object.fromEntries(
      voteCounts.map((v) => [v._id.toString(), v.vote_count])
    );

    const result = filtered.map((c) => {
      const obj = {
        candidate_id: c._id,
        position: c.position,
        manifesto: c.manifesto,
        photo_url: c.student_id?.photo_url || null,
        election: c.election_id,

        student: {
          id: c.student_id._id,
          full_name: c.student_id.full_name,
          faculty_id: c.student_id.faculty_id,
          status: c.student_id.status,
          photo_url: c.student_id.photo_url,
        },

        vote_count: voteMap[c._id.toString()] || 0,
        created_at: c.created_at,
        updated_at: c.updated_at,

        created_by: c.created_by
          ? {
              id: c.created_by._id,
              username: c.created_by.username,
              email: c.created_by.email,
              role: c.created_by.role,
            }
          : null,
      };
      return obj;
    });

    res.json(result);

  } catch (err) {
    return handleControllerError(res, err, "Failed to fetch candidates");
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("created_by", "username email role")
      .populate({
        path: "student_id",
        select: "full_name faculty_id status photo_url",
        populate: { path: "faculty_id", select: "name code" },
      })

      .populate("election_id");

    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    if (!isSuperAdmin(req.user)) {
      assertCondition(
        candidate.student_id?.faculty_id && req.user.faculty_id,
        403,
        "Access denied - You can only access candidates from your faculty"
      );
      assertCondition(
        candidate.student_id.faculty_id._id.toString() === req.user.faculty_id.toString(),
        403,
        "Access denied - You can only access candidates from your faculty"
      );
    }

    const voteCountResult = await Vote.aggregate([
      { $unwind: "$votes" },
      { $match: { "votes.candidate_id": candidate._id } },
      { $count: "vote_count" },
    ]);

    const voteCount = voteCountResult.length > 0 ? voteCountResult[0].vote_count : 0;

    const response = {
      candidate_id: candidate._id,
      position: candidate.position,
      manifesto: candidate.manifesto,
      photo_url: candidate.student_id?.photo_url || null,
      election: candidate.election_id,

      student: {
        id: candidate.student_id._id,
        full_name: candidate.student_id.full_name,
        faculty_id: candidate.student_id.faculty_id,
        status: candidate.student_id.status,
        photo_url: candidate.student_id.photo_url,
      },

      vote_count: voteCount,
      created_by: candidate.created_by,
      created_at: formatDateTime(candidate.created_at),
      updated_at: formatDateTime(candidate.updated_at),
    };

    res.json(response);
  } catch (err) {
    return handleControllerError(res, err, "Error fetching candidate");
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const { position, manifesto } = req.body;
    const candidate = req.candidate;

    const election = await Election.findById(candidate.election_id);
    assertCondition(
      election?.status === ElectionStatusEnum.UPCOMING,
      400,
      "You cannot edit a candidate after the election has started"
    );

    if (position) candidate.position = normalizeString(position);
    if (manifesto) candidate.manifesto = normalizeString(manifesto);
    candidate.updated_by = req.user.id;

    await candidate.save();

    const populated = await Candidate.findById(candidate._id)
      .populate("created_by", "username email role")

      .populate({
        path: "student_id",
        select: "full_name faculty_id status photo_url",
        populate: { path: "faculty_id", select: "name code" },
      })

      .populate("election_id");

    const updatedCandidate = populated?.toObject?.() || populated;
    if (updatedCandidate) {
      updatedCandidate.photo_url = updatedCandidate.student_id?.photo_url || null;
    }

    res.json({ message: "Candidate updated", updated: updatedCandidate });

  } catch (err) {
    return handleControllerError(res, err, "Failed to update candidate");
  }
};

export const deleteCandidate = async (req, res) => {
  const candidate = req.candidate;

  try {
    const election = await Election.findById(candidate.election_id);
    if (!election) return res.status(404).json({ error: "Election not found" });

    if (election.status !== ElectionStatusEnum.UPCOMING) {
      return res.status(400).json({
        error: "You cannot delete a candidate after the election has started",
      });
    }

    await candidate.deleteOne();
    res.json({ message: "Candidate deleted" });

  } catch (err) {
    return handleControllerError(res, err, "Delete failed");
  }
};

export const getCandidatesByElection = async (req, res) => {
  const { electionId } = req.params;

  try {
    ensureValidObjectId(electionId, "election ID");

    if (!isSuperAdmin(req.user)) {
      const election = await Election.findById(electionId);
      assertCondition(election, 404, "Election not found");

      const isStudentUnionElection =
        election.type === ElectionTypeEnum.STUDENT_UNION_ELECTION;

      // Student Union elections are cross-faculty; only faculty elections require faculty scope match.
      if (!isStudentUnionElection) {
        assertCondition(
          election.faculty_id && req.user.faculty_id,
          403,
          "Access denied - You can only access candidates from your faculty elections"
        );
        assertCondition(
          election.faculty_id.toString() === req.user.faculty_id.toString(),
          403,
          "Access denied - You can only access candidates from your faculty elections"
        );
      }
    }

    const candidates = await Candidate.find({
      election_id: electionId,
    }).populate({
      path: "student_id",
      select: "full_name faculty_id status",
      populate: { path: "faculty_id", select: "name code" },
    });

    const voteCounts = await Vote.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(electionId) } },
      { $unwind: "$votes" },
      { $group: { _id: "$votes.candidate_id", vote_count: { $sum: 1 } } },
    ]);

    const voteMap = Object.fromEntries(
      voteCounts.map((v) => [v._id.toString(), v.vote_count])
    );

    const result = candidates.map((c) => ({
      candidate_id: c._id,
      name: c.student_id.full_name,
      position: c.position,
      manifesto: c.manifesto,
      photo_url: c.student_id?.photo_url || null,
      vote_count: voteMap[c._id.toString()] || 0,
      startDate: c.created_at,
      endDate: c.updated_at,
      status: c.student_id.status,
      faculty_id: c.student_id.faculty_id,
    }));

    res.json(result);

  } catch (err) {
    return handleControllerError(res, err, "Failed to fetch candidates");
  }
};

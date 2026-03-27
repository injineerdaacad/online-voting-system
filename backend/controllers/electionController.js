import mongoose from "mongoose";
import {
  Student,
  StudentStatusEnum,
  Election,
  ElectionTypeEnum,
  ElectionStatusEnum,
  Vote,
  Admin,
} from "../models/index.js";
import {
  normalizeString,
  computeElectionStatus,
  formatDateInTimeZone,
  toDateInTimeZone,
  DEFAULT_TIMEZONE,
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const createElection = async (req, res) => {
  try {
    const { title, description, type, faculty_id, start_time, end_time } =
      req.body;
    const admin = req.user;

    assertCondition(title && type && start_time && end_time, 400, "Title, type, start time, and end time are required");

    if (!isSuperAdmin(admin)) {
      let userFacultyId = admin.faculty_id;
      if (!userFacultyId && admin.id) {
        const user = await Admin.findById(admin.id).select('faculty_id');
        if (user && user.faculty_id) {
          userFacultyId = user.faculty_id;
        }
      }

      assertCondition(
        userFacultyId,
        403,
        "Faculty Admin must be assigned to a faculty"
      );

      assertCondition(
        type === ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION,
        403,
        "You can only create Faculty Leadership Elections"
      );

      assertCondition(
        type !== ElectionTypeEnum.STUDENT_UNION_ELECTION,
        403,
        "Only Super Admins can create Union elections"
      );

      let userFacultyIdString;
      if (typeof userFacultyId === 'string') {
        userFacultyIdString = userFacultyId;
      } else if (userFacultyId && userFacultyId.toString) {
        userFacultyIdString = userFacultyId.toString();
      } else if (userFacultyId && userFacultyId._id) {
        userFacultyIdString = userFacultyId._id.toString();
      } else {
        throw new Error("Invalid faculty_id format in user token");
      }

      assertCondition(
        faculty_id &&
          userFacultyIdString === faculty_id.toString(),
        403,
        "You can only create elections for your own faculty"
      );
    }

    if (faculty_id) {
      ensureValidObjectId(faculty_id, "faculty_id");
    }

    const election = new Election({
      title: normalizeString(title),
      description: description ? normalizeString(description) : description,
      type,
      faculty_id: type === ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION ? faculty_id : null,
      start_time: toDateInTimeZone(start_time, DEFAULT_TIMEZONE),
      end_time: toDateInTimeZone(end_time, DEFAULT_TIMEZONE),
      status: ElectionStatusEnum.UPCOMING,
      created_by: req.user.id,
    });

    await election.save();

    res.status(201).json({ message: "Election created", election });

  } catch (err) {
    return handleControllerError(res, err, "Server error");
  }
};

export const getAllElections = async (req, res) => {
  try {
    let query = {};
    if (!isSuperAdmin(req.user)) {
      let userFacultyId = req.user.faculty_id;

      if (!userFacultyId && req.user.id) {
        const user = await Admin.findById(req.user.id).select('faculty_id');
        if (user && user.faculty_id) {
          userFacultyId = user.faculty_id;
        }
      }

      assertCondition(userFacultyId, 403, "Faculty Admin must be assigned to a faculty");

      let facultyIdString;
      if (typeof userFacultyId === 'string') {
        facultyIdString = userFacultyId;
      } else if (userFacultyId && userFacultyId.toString) {
        facultyIdString = userFacultyId.toString();
      } else if (userFacultyId && userFacultyId._id) {
        facultyIdString = userFacultyId._id.toString();
      } else {
        throw new Error("Invalid faculty_id format in user token");
      }

      ensureValidObjectId(facultyIdString, "faculty_id");

      query.faculty_id = new mongoose.Types.ObjectId(facultyIdString);
    }

    const elections = await Election.find(query)
      .select("-__v")
      .populate("faculty_id", "name code")
      .populate("created_by", "username role");

    const updatedElections = await Promise.all(
      elections.map(async (e) => {
        const obj = e.toObject();
        const newStatus = computeElectionStatus(
          obj,
          ElectionStatusEnum,
          DEFAULT_TIMEZONE
        );

        if (e.status !== newStatus && e.status !== ElectionStatusEnum.INACTIVE) {
          e.status = newStatus;
          await e.save();
        }

        obj.status = newStatus;
        obj.start_time = formatDateInTimeZone(obj.start_time, DEFAULT_TIMEZONE);
        obj.end_time = formatDateInTimeZone(obj.end_time, DEFAULT_TIMEZONE);
        obj.created_at = formatDateInTimeZone(obj.created_at, DEFAULT_TIMEZONE);
        obj.updated_at = formatDateInTimeZone(obj.updated_at, DEFAULT_TIMEZONE);

        return obj;
      })
    );

    res.json(updatedElections);
  } catch (err) {
    return handleControllerError(res, err, "Error fetching elections");
  }
};

export const updateElection = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, "election id");

    const election = await Election.findById(req.params.id);
    assertCondition(election, 404, "Election not found");

    if (!isSuperAdmin(req.user)) {
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

      const electionFacultyId = election.faculty_id._id
        ? election.faculty_id._id.toString()
        : election.faculty_id.toString();

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
        "Access denied - You can only update elections in your faculty"
      );
    }

    assertCondition(
      election.status === ElectionStatusEnum.UPCOMING,
      400,
      "You cannot edit an election after it starts"
    );

    const updates = { ...req.body };

    if (updates.title) updates.title = normalizeString(updates.title);
    if (updates.description) updates.description = normalizeString(updates.description);
    if (updates.start_time)
      updates.start_time = toDateInTimeZone(updates.start_time, DEFAULT_TIMEZONE);
    if (updates.end_time)
      updates.end_time = toDateInTimeZone(updates.end_time, DEFAULT_TIMEZONE);

    if (updates.faculty_id) {
      ensureValidObjectId(updates.faculty_id, "faculty_id");
    }

    Object.assign(election, updates);
    election.updated_by = req.user.id;

    if (election.status !== ElectionStatusEnum.INACTIVE) {
      election.status = computeElectionStatus(
        election,
        ElectionStatusEnum,
        DEFAULT_TIMEZONE
      );
    }

    await election.save();

    res.json({ message: "Election updated", updated: election });
  } catch (err) {
    return handleControllerError(res, err, "Update failed");
  }
};

export const deleteElection = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, "election id");

    const election = await Election.findById(req.params.id);
    assertCondition(election, 404, "Election not found");

    if (!isSuperAdmin(req.user)) {
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

      const electionFacultyId = election.faculty_id._id
        ? election.faculty_id._id.toString()
        : election.faculty_id.toString();

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
        "Access denied - You can only delete elections in your faculty"
      );
    }

    const deleted = await Election.findByIdAndDelete(req.params.id);
    assertCondition(deleted, 404, "Election not found");
    res.json({ message: "Election deleted" });

  } catch (err) {
    return handleControllerError(res, err, "Delete failed");
  }
};

export const getElectionById = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, "election id");

    const election = await Election.findById(req.params.id)
      .populate("faculty_id", "name code")
      .populate("created_by", "username role");

    assertCondition(election, 404, "Election not found");

    if (!isSuperAdmin(req.user)) {
      const isStudentUnionElection =
        election.type === ElectionTypeEnum.STUDENT_UNION_ELECTION;

      if (!isStudentUnionElection) {
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

        const electionFacultyId = election.faculty_id._id
          ? election.faculty_id._id.toString()
          : election.faculty_id.toString();

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
          "Access denied - You can only access elections in your faculty"
        );
      }
    }

    const obj = election.toObject();
    const newStatus = computeElectionStatus(
      obj,
      ElectionStatusEnum,
      DEFAULT_TIMEZONE
    );

    if (election.status !== newStatus && election.status !== ElectionStatusEnum.INACTIVE) {
      election.status = newStatus;
      await election.save();
    }

    obj.status = newStatus;
    obj.start_time = obj.start_time ? new Date(obj.start_time).toISOString() : null;
    obj.end_time = obj.end_time ? new Date(obj.end_time).toISOString() : null;

    obj.created_at = formatDateInTimeZone(obj.created_at, DEFAULT_TIMEZONE);
    obj.updated_at = formatDateInTimeZone(obj.updated_at, DEFAULT_TIMEZONE);

    res.json(obj);

  } catch (err) {
    return handleControllerError(res, err, "Error retrieving election");
  }
};

export const getEligibleElectionsForStudent = async (req, res) => {
  try {
  const { student_id } = req.params;
  ensureValidObjectId(student_id, "student_id");

  const student = await Student.findById(student_id);
  assertCondition(student, 404, "Student not found");

    let query = {};

    if (student.status === StudentStatusEnum.ACTIVE) {
      query = {
        $or: [
          { type: ElectionTypeEnum.STUDENT_UNION_ELECTION },
          { type: ElectionTypeEnum.FACULTY_LEADERSHIP_ELECTION, faculty_id: student.faculty_id },
        ],
      };
    } else {
      return res.json([]);
    }

    const elections = await Election.find(query)
      .select("-__v")
      .populate("faculty_id", "name code")
      .populate("created_by", "username role");

    const isMobileClient = req.headers['x-client-type'] === 'mobile' || req.headers['X-Client-Type'] === 'mobile';

    const updatedElections = await Promise.all(
      elections.map(async (e) => {
        const obj = e.toObject();
        const newStatus = computeElectionStatus(
          obj,
          ElectionStatusEnum,
          DEFAULT_TIMEZONE
        );

        if (e.status !== newStatus && e.status !== ElectionStatusEnum.INACTIVE) {
          e.status = newStatus;
          await e.save();
        }

        obj.status = newStatus;

        if (isMobileClient) {
          obj.start_time = obj.start_time ? new Date(obj.start_time).toISOString() : null;
          obj.end_time = obj.end_time ? new Date(obj.end_time).toISOString() : null;
          obj.created_at = obj.created_at ? new Date(obj.created_at).toISOString() : null;
          obj.updated_at = obj.updated_at ? new Date(obj.updated_at).toISOString() : null;
        } else {
          obj.start_time = formatDateInTimeZone(obj.start_time, DEFAULT_TIMEZONE);
          obj.end_time = formatDateInTimeZone(obj.end_time, DEFAULT_TIMEZONE);
          obj.created_at = formatDateInTimeZone(obj.created_at, DEFAULT_TIMEZONE);
          obj.updated_at = formatDateInTimeZone(obj.updated_at, DEFAULT_TIMEZONE);
        }

        return obj;
      })
    );

    const votes = await Vote.find({ voter_id: student._id });

    const votedElectionIds = new Set(
      votes.map((v) => v.election_id.toString())
    );

    const electionsWithHasVoted = updatedElections.map((e) => {
      e.hasVoted = votedElectionIds.has(e._id.toString());
      return e;
    });

    res.json(electionsWithHasVoted);

  } catch (err) {
    return handleControllerError(res, err, "Error fetching eligible elections");
  }
};

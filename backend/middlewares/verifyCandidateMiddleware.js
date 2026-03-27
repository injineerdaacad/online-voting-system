import { Candidate } from "../models/index.js";
import {
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const verifyCandidateAccess = async (req, res, next) => {
  try {
    ensureValidObjectId(req.params.id, "candidate id");

    const candidate = await Candidate.findById(req.params.id).populate(
      "student_id"
    );
    assertCondition(candidate, 404, "Candidate not found");

    if (!isSuperAdmin(req.user)) {
      const candidateFaculty = candidate.student_id?.faculty_id;
      const userFaculty = req.user?.faculty_id;
      assertCondition(userFaculty, 403, "Access denied to this candidate");
      assertCondition(
        candidateFaculty?.toString() === userFaculty.toString(),
        403,
        "Access denied to this candidate"
      );
    }

    req.candidate = candidate;
    return next();
  } catch (err) {
    return handleControllerError(res, err, "Failed to verify candidate access");
  }
};
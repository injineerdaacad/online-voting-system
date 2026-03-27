import {
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const restrictToOwnFaculty = (req, res, next) => {
  try {
    if (isSuperAdmin(req.user)) {
      return next();
    }

    const facultyIdFromBody = req.body?.faculty_id;
    const facultyIdFromParams = req.params?.facultyId;
    const facultyIdToCheck = facultyIdFromBody || facultyIdFromParams;

    assertCondition(facultyIdToCheck, 400, "Faculty ID is required");
    ensureValidObjectId(facultyIdToCheck, "faculty id");

    const userFaculty = req.user?.faculty_id;
    assertCondition(userFaculty, 403, "Access denied to other faculties");
    assertCondition(
      userFaculty.toString() === facultyIdToCheck.toString(),
      403,
      "Access denied to other faculties"
    );

    return next();
  } catch (err) {
    return handleControllerError(res, err, "Faculty access denied");
  }
};
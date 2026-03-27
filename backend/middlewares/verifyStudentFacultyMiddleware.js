import { Student } from "../models/index.js";
import {
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const verifyStudentFacultyAccess = async (req, res, next) => {
  try {
    ensureValidObjectId(req.params.id, "student id");

    const student = await Student.findById(req.params.id);
    assertCondition(student, 404, "Student not found");

    if (!isSuperAdmin(req.user)) {
      const userFaculty = req.user?.faculty_id;
      assertCondition(userFaculty, 403, "Access denied to this student");
      assertCondition(
        student.faculty_id?.toString() === userFaculty.toString(),
        403,
        "Access denied to this student"
      );
    }

    req.student = student;
    return next();
  } catch (err) {
    return handleControllerError(res, err, "Server error while verifying access");
  }
};
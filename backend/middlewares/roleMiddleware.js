import { AdminRoleEnum } from "../models/index.js";
import { assertCondition, handleControllerError } from "../utils/controllerHelpers.js";

export function requireSuperAdmin(req, res, next) {
  try {
    assertCondition(req.user, 401, "Unauthorized");
    assertCondition(
      req.user.role === AdminRoleEnum.SUPER_ADMIN,
      403,
      "Access denied - Super Admin only"
    );
    return next();
  } catch (err) {
    return handleControllerError(res, err, "Authorization failed");
  }
}

export function requireAdmin(req, res, next) {
  try {
    assertCondition(req.user, 401, "Unauthorized");
    assertCondition(
      req.user.role === AdminRoleEnum.ADMIN || req.user.role === AdminRoleEnum.SUPER_ADMIN,
      403,
      "Access denied - Admin access required"
    );
    return next();
  } catch (err) {
    return handleControllerError(res, err, "Authorization failed");
  }
}

export function requireFacultyAdmin(req, res, next) {
  try {
    assertCondition(req.user, 401, "Unauthorized");
    assertCondition(
      req.user.role === AdminRoleEnum.ADMIN,
      403,
      "Access denied - Faculty Admin only"
    );
    assertCondition(
      req.user.faculty_id,
      403,
      "Faculty Admin must be assigned to a faculty"
    );
    return next();
  } catch (err) {
    return handleControllerError(res, err, "Authorization failed");
  }
}
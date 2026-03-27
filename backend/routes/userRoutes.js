import express from "express";
import { AdminRoleEnum } from "../models/index.js";
import {
  createUser,
  addAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  changeOwnPassword,
  superAdminResetPassword,
  getLockedAdmins,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserById,
  lockUser,
  unlockUser,
  checkStudentInUniversityAPI,
  searchStudentIds,
} from "../controllers/index.js";
import {
  authenticateJWT,
  authorizeRoles,
  imageUpload,
  handleMulterError,
} from "../middlewares/index.js";

const router = express.Router();

router.get(
  "/profile",
  authenticateJWT,
  getCurrentUserProfile
);

router.put(
  "/profile",
  authenticateJWT,
  imageUpload.single('photo'),
  handleMulterError,
  updateCurrentUserProfile
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  getAllAdmins
);

router.get(
  "/search-student-ids",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  searchStudentIds
);

router.get(
  "/check/:student_id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  checkStudentInUniversityAPI
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  getUserById
);

router.get(
  "/locked",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  getLockedAdmins
);

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  createUser
);

router.post(
  "/add",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  imageUpload.single("photo"),
  handleMulterError,
  addAdmin
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  imageUpload.single("photo"),
  handleMulterError,
  updateAdmin
);

router.patch(
  "/change-password",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  changeOwnPassword
);

router.patch(
  "/:id/reset-password",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  superAdminResetPassword
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  deleteAdmin
);

router.patch(
  "/:id/lock",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  lockUser
);

router.patch(
  "/:id/unlock",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN),
  unlockUser
);

export default router;
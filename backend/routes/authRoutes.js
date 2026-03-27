import express from 'express';
import { AdminRoleEnum } from "../models/index.js";
import {
  loginAdmin,
  loginStudent,
  logoutAdmin,
  logoutStudent,
  unlockUser,
} from "../controllers/index.js";
import { authenticateJWT, authorizeRoles, mobileOnly } from "../middlewares/index.js";

const router = express.Router();

router.post(
  '/admin/login',
  loginAdmin
);

router.post(
  "/admin/logout",
  authenticateJWT,
  logoutAdmin
);

router.post(
  '/unlock',
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  unlockUser
);

router.post(
  "/student/login",
  mobileOnly,
  loginStudent
);

router.post(
  "/student/logout",
  authenticateJWT,
  logoutStudent
);

export default router;
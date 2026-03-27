import express from 'express';
import { AdminRoleEnum } from "../models/index.js";
import {
  addDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controllers/index.js";
import {
  authenticateJWT,
  authorizeRoles,
  restrictToOwnFaculty,
} from "../middlewares/index.js";

const router = express.Router();

router.get(
  '/',
  authenticateJWT,
  getAllDepartments
);

router.get(
  '/:id',
  authenticateJWT,
  getDepartmentById
);

router.post(
  "/add",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  restrictToOwnFaculty,
  addDepartment
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  updateDepartment
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  deleteDepartment
);

export default router;
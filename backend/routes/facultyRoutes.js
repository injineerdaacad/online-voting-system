import express from 'express';
import { AdminRoleEnum } from "../models/index.js";
import {
  addFaculty,
  updateFaculty,
  deleteFaculty,
  getAllFaculties,
  getFacultyById,
} from "../controllers/index.js";
import { authenticateJWT, authorizeRoles } from "../middlewares/index.js";

const router = express.Router();

router.get(
  "/",
  authenticateJWT,
  getAllFaculties
);

router.get(
  "/:id",
  authenticateJWT,
  getFacultyById
);

router.post(
  "/add",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  addFaculty
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  updateFaculty
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.SUPER_ADMIN),
  deleteFaculty
);

export default router;
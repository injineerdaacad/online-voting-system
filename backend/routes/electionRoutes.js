import express from "express";
import { AdminRoleEnum } from "../models/index.js";
import {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
  getEligibleElectionsForStudent,
} from "../controllers/index.js";
import { authenticateJWT, authorizeRoles } from "../middlewares/index.js";

const router = express.Router();

router.get(
  "/",
  authenticateJWT,
  getAllElections
);

router.get(
  "/:id",
  authenticateJWT,
  getElectionById
);

router.get(
  "/eligible/:student_id",
  authenticateJWT,
  getEligibleElectionsForStudent
);

router.post(
  "/create",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  createElection
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  updateElection
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  deleteElection
);

export default router;
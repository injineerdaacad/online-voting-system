import express from "express";
import { AdminRoleEnum } from "../models/index.js";
import {
  addCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  getCandidatesByElection,
} from "../controllers/index.js";
import {
  authenticateJWT,
  authorizeRoles,
  verifyCandidateAccess,
} from "../middlewares/index.js";

const router = express.Router();

router.get(
  "/",
  authenticateJWT,
  getAllCandidates
);

router.get(
  "/:id",
  authenticateJWT,
  getCandidateById
);

router.get(
  "/by-election/:electionId",
  authenticateJWT,
  getCandidatesByElection
);

router.post(
  "/add",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  addCandidate
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  verifyCandidateAccess,
  updateCandidate
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(AdminRoleEnum.ADMIN, AdminRoleEnum.SUPER_ADMIN),
  verifyCandidateAccess,
  deleteCandidate
);

export default router;
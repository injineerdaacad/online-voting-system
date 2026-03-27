import express from 'express';
import { StudentRoleEnum } from "../models/index.js";
import { voteForCandidate } from "../controllers/index.js";
import { authenticateJWT, authorizeRoles } from "../middlewares/index.js";

const router = express.Router();

router.post(
    '/voteForCandidate',
    authenticateJWT,
    authorizeRoles(StudentRoleEnum.STUDENT),
    voteForCandidate
);

export default router;
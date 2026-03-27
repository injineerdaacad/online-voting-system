import express from 'express';
import { getElectionResults } from "../controllers/index.js";
import { authenticateJWT } from "../middlewares/index.js";

const router = express.Router();

router.get(
    '/:electionId',
    authenticateJWT,
    getElectionResults
);

export default router;
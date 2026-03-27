import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { postAssistant } from "../controllers/aiAssistantController.js";

const router = express.Router();

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.AI_ASSISTANT_RATE_LIMIT_MAX, 10),
  message: { error: "Too many requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/assistant",
  authenticateJWT,
  assistantLimiter,
  postAssistant
);

export default router;
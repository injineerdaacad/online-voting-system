import { assertCondition, handleControllerError } from "../utils/controllerHelpers.js";
import { UserRoleEnum } from "../utils/constants.js";
import { getSimpleAnswer } from "../services/aiSimpleAnswers.js";
import { buildAssistantContext } from "../services/aiContextBuilder.js";
import { getContextOnlyReply } from "../services/aiContextReply.js";
import { getCachedReply, setCachedReply } from "../services/aiChatCache.js";
import { isDailyLimitReached, incrementDailyCount } from "../services/aiDailyLimit.js";
import { getGeminiReply } from "../services/geminiService.js";

export const postAssistant = async (req, res) => {
  try {
    assertCondition(req.user, 401, "Unauthorized");
    assertCondition(
      req.user.role === UserRoleEnum.STUDENT,
      403,
      "AI Assistant is for students only"
    );

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    assertCondition(message.length > 0, 400, "message is required and must be non-empty");

    const lang = req.body?.language === "en" ? "en" : "so";

    // Layer 1: simple keyword answers (no Gemini)
    const simpleReply = getSimpleAnswer(message, lang);
    if (simpleReply) {
      return res.status(200).json({ reply: simpleReply });
    }

    // Build context for Layer 2 and Layer 3
    const studentId = req.user.id;
    const facultyId = req.user.faculty_id || null;
    const context = await buildAssistantContext(studentId, facultyId, lang);

    // Layer 2: context-only reply (e.g. active elections, schedule)
    const contextReply = getContextOnlyReply(context, message, lang);
    if (contextReply) {
      return res.status(200).json({ reply: contextReply });
    }

    // Cache
    const cached = getCachedReply(message, lang);
    if (cached) {
      return res.status(200).json({ reply: cached });
    }

    // Daily limit (Gemini kill-switch)
    if (isDailyLimitReached()) {
      const busyMsg =
        lang === "en"
          ? "Service is busy. Please try again later."
          : "Adeegga waa busy. Fadlan isku day wakhti ka dib.";
      return res.status(200).json({ reply: busyMsg });
    }

    incrementDailyCount();

    // Layer 3: Gemini
    const { reply, error } = await getGeminiReply(context, message);

    if (reply) {
      setCachedReply(message, lang, reply);
    }

    const payload = { reply: reply || (lang === "en" ? "No response. Try again." : "Jawaab lama helin. Isku day mar kale.") };
    if (error) payload.error = error;

    return res.status(200).json(payload);
  } catch (err) {
    return handleControllerError(res, err, "AI Assistant failed");
  }
};
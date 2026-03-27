const PROJECT_VERCEL_ORIGIN_REGEX =
  /^https:\/\/online-voting-system(?:-[a-z0-9-]+)?\.vercel\.app$/i;

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseAllowedOrigins = (originsCsv = "") =>
  originsCsv
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const buildOriginMatcher = (originsCsv = "") => {
  const allowedOriginRules = parseAllowedOrigins(originsCsv);
  const hasGlobalWildcard = allowedOriginRules.includes("*");
  const exactOrigins = new Set();
  const wildcardPatterns = [];

  allowedOriginRules.forEach((rule) => {
    const normalizedRule = rule.toLowerCase();

    if (normalizedRule === "*") {
      return;
    }

    if (normalizedRule.includes("*")) {
      const regexPattern = `^${escapeRegex(normalizedRule).replace(
        /\\\*/g,
        ".*"
      )}$`;
      wildcardPatterns.push(new RegExp(regexPattern, "i"));
      return;
    }

    exactOrigins.add(normalizedRule);
  });

  const isAllowedOrigin = (origin) => {
    if (!origin) {
      return true;
    }

    const normalizedOrigin = origin.trim().toLowerCase();

    if (hasGlobalWildcard) {
      return true;
    }

    if (exactOrigins.has(normalizedOrigin)) {
      return true;
    }

    if (wildcardPatterns.some((pattern) => pattern.test(normalizedOrigin))) {
      return true;
    }

    if (PROJECT_VERCEL_ORIGIN_REGEX.test(normalizedOrigin)) {
      return true;
    }

    return false;
  };

  return {
    allowedOriginRules,
    isAllowedOrigin,
  };
};

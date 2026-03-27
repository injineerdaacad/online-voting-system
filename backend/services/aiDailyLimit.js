const DEFAULT_DAILY_LIMIT = 50;
let count = 0;
let lastDate = "";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isDailyLimitReached() {
  const today = getTodayKey();
  if (today !== lastDate) {
    lastDate = today;
    count = 0;
  }
  const limit = parseInt(process.env.GEMINI_DAILY_LIMIT, 10) || DEFAULT_DAILY_LIMIT;
  return count >= limit;
}

export function incrementDailyCount() {
  const today = getTodayKey();
  if (today !== lastDate) {
    lastDate = today;
    count = 0;
  }
  count += 1;
}
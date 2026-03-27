const SIMPLE_SO = {
  "sidee u login gareeyaa": "Guji Login, geli student ID iyo password-kaaga, kadib guji Sign in.",
  "sidee loo codeeyaa": "Guji tab-ka Vote, dooro doorashada, dooro 2 musharrax oo guji Codee. Hal cod oo keliya per doorasho.",
  "sidee loo codeeyaa?": "Guji tab-ka Vote, dooro doorashada, dooro 2 musharrax oo guji Codee. Hal cod oo keliya per doorasho.",
  "login": "Guji Login, geli student ID iyo password-kaaga.",
  "support": "Wax la weydiiyo ka qaybqaado admin-ka jaamacadda ama IT support.",
  "help": "Waxaan kaaga caawin karaa: Doorashooyinka Active, Jadwalka, Musharraxiinta, Natiijooyinka, Sidee loo codeeyaa. Weydii su’aal.",
};

const SIMPLE_EN = {
  "how do i login": "Tap Login, enter your student ID and password, then tap Sign in.",
  "how do i vote": "Go to the Vote tab, select an election, choose 2 candidates and tap Vote. One vote per election.",
  "how to vote": "Go to the Vote tab, select an election, choose 2 candidates and tap Vote. One vote per election.",
  "login": "Tap Login and enter your student ID and password.",
  "support": "Contact your university admin or IT support for help.",
  "help": "I can help with: Active elections, Schedule, Candidates, Results, How to vote. Ask a question.",
};

function normalizeForMatch(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\?|\.|,|!/g, "");
}

export function getSimpleAnswer(question, lang) {
  const normalized = normalizeForMatch(question);
  if (!normalized) return null;

  const map = lang === "en" ? SIMPLE_EN : SIMPLE_SO;
  for (const [key, answer] of Object.entries(map)) {
    const keyNorm = normalizeForMatch(key);
    if (normalized === keyNorm || (keyNorm.length >= 4 && normalized.includes(keyNorm))) {
      return answer;
    }
  }
  return null;
}
function normalizeForMatch(text) {
  return (text || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function isAboutActiveElections(q) {
  const n = normalizeForMatch(q);
  return (
    n.includes("active") ||
    n.includes("doorashooyinka active") ||
    n.includes("ongoing") ||
    n.includes("current election")
  );
}

function isAboutSchedule(q) {
  const n = normalizeForMatch(q);
  return (
    n.includes("jadwal") ||
    n.includes("schedule") ||
    n.includes("wakhti") ||
    n.includes("time") ||
    n.includes("goorma") ||
    n.includes("when")
  );
}

function isAboutCandidates(q) {
  const n = normalizeForMatch(q);
  return (
    n.includes("musharrax") ||
    n.includes("candidate") ||
    n.includes("position")
  );
}

function isAboutResults(q) {
  const n = normalizeForMatch(q);
  return n.includes("natiijo") || n.includes("result") || n.includes("who won");
}

function isAboutHowToVote(q) {
  const n = normalizeForMatch(q);
  return (
    n.includes("sidee loo codeeyaa") ||
    n.includes("how do i vote") ||
    n.includes("how to vote") ||
    n.includes("codee")
  );
}

function isAboutHasVoted(q) {
  const n = normalizeForMatch(q);
  return (
    n.includes("codeeysay") ||
    n.includes("have i voted") ||
    n.includes("did i vote") ||
    n.includes("voted")
  );
}

export function getContextOnlyReply(context, question, lang) {
  const so = lang !== "en";
  const elections = context.elections || [];
  const candidates = context.candidates || [];
  const hasVoted = context.hasVoted || {};
  const rules = context.rulesSummary || "";

  const active = elections.filter((e) => e.status === "Active");
  const upcoming = elections.filter((e) => e.status === "Upcoming");
  const closed = elections.filter((e) => e.status === "Closed");

  if (isAboutActiveElections(question)) {
    if (active.length === 0) {
      return so
        ? "Wakhtigan ma jiraan doorashooyin Active ah. Eeg Jadwalka."
        : "There are no active elections right now. Check the schedule.";
    }
    const lines = active.slice(0, 5).map((e) => `• ${e.title} (${e.type})`);
    return so
      ? "Doorashooyinka Active ka ah:\n" + lines.join("\n")
      : "Active elections:\n" + lines.join("\n");
  }

  if (isAboutSchedule(question)) {
    if (elections.length === 0) {
      return so ? "Wakhtigan ma jiraan jadwal." : "No schedule at the moment.";
    }
    const lines = elections.slice(0, 5).map(
      (e) => `• ${e.title}: ${e.start_time} – ${e.end_time}`
    );
    return so ? "Jadwalka:\n" + lines.join("\n") : "Schedule:\n" + lines.join("\n");
  }

  if (isAboutCandidates(question)) {
    if (candidates.length === 0) {
      return so ? "Wakhtigan musharraxiin ma jiraan." : "No candidates at the moment.";
    }
    const byPos = {};
    candidates.forEach((c) => {
      const p = c.position || "—";
      if (!byPos[p]) byPos[p] = [];
      byPos[p].push(c.name);
    });
    const lines = Object.entries(byPos).slice(0, 5).map(
      ([pos, names]) => `• ${pos}: ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}`
    );
    return so ? "Musharraxiinta (position):\n" + lines.join("\n") : "Candidates:\n" + lines.join("\n");
  }

  if (isAboutResults(question)) {
    if (closed.length === 0) {
      return so
        ? "Natiijooyinka waxaa laga arki karaa marka doorashadu xirantahay. Eeg Jadwalka."
        : "Results are visible when the election is closed. Check the schedule.";
    }
    const lines = closed.slice(0, 5).map((e) => `• ${e.title} (xiran)`);
    return so ? "Doorashooyinka xiran (natiijo laga arki karo):\n" + lines.join("\n") : "Closed elections (results available):\n" + lines.join("\n");
  }

  if (isAboutHowToVote(question)) {
    return so
      ? "Guji tab-ka Vote, dooro doorashada, dooro 2 musharrax oo guji Codee. Hal cod oo keliya per doorasho."
      : "Go to the Vote tab, select an election, choose 2 candidates and tap Vote. One vote per election.";
  }

  if (isAboutHasVoted(question)) {
    const votedIds = Object.keys(hasVoted).filter((id) => hasVoted[id]);
    if (votedIds.length === 0) {
      return so ? "Weli ma codeysan doorashooyinka." : "You have not voted in any election yet.";
    }
    const titles = elections.filter((e) => votedIds.includes(e._id)).map((e) => e.title);
    const list = titles.slice(0, 3).join(", ") + (titles.length > 3 ? "…" : "");
    return so ? `Waad codeysay: ${list}.` : `You have voted in: ${list}.`;
  }

  return null;
}
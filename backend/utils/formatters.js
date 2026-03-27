import moment from "moment-timezone";

export const DEFAULT_TIMEZONE = "Africa/Mogadishu";

export const normalizeString = (string) => {
  if (!string || typeof string !== "string") return string;
  return string
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const toCapitalize = (string) => {
  if (!string || typeof string !== "string") return string;
  return string
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const formatDateTime = (d, timezone = DEFAULT_TIMEZONE) => {
  if (!d) return null;
  const m = moment.tz(d, timezone);
  const dayName = m.format("dddd");
  const date = m.format("DD-MM-YYYY");
  const time = m.format("h:mm A");
  return `${dayName} Date ${date} time ${time}`;
};

export const toDateInTimeZone = (value, timezone = DEFAULT_TIMEZONE) =>
  value ? moment.tz(value, timezone).toDate() : null;

export const formatDateInTimeZone = (
  value,
  timezone = DEFAULT_TIMEZONE,
  format = "dddd Date DD-MM-YYYY time h:mm A"
) => {
  if (!value) return null;
  const m = moment.tz(value, timezone);
  if (format === "dddd Date DD-MM-YYYY time h:mm A") {
    const dayName = m.format("dddd");
    const date = m.format("DD-MM-YYYY");
    const time = m.format("h:mm A");
    return `${dayName} Date ${date} time ${time}`;
  }
  return m.format(format);
};

export const mapHasVoted = (hasVoted = []) => {
  if (!Array.isArray(hasVoted)) return [];
  return hasVoted.map((vote) => {
    const election = vote?.election_id;
    const faculty = election?.faculty_id;

    if (!election) {
      return {
        election_id: null,
        voted_at: vote?.voted_at || null,
        status: null,
        type: null,
        title: null,
        faculty: null,
        faculty_id: null,
        _id: vote?._id,
      };
    }

    return {
      election_id: election?._id || election,
      voted_at: vote?.voted_at || null,
      status: election?.status || null,
      type: election?.type || null,
      title: election?.title || null,
      faculty: faculty?.name || null,
      faculty_id: faculty?._id || faculty || null,
      _id: vote?._id,
    };
  });
};

export const formatVotingHistory = (votes = []) =>
  votes.map((vote) => {
    const election = vote?.election_id;
    const candidate = vote?.candidate_id;
    const candidateStudent = candidate?.student_id;

    return {
      voted_at: formatDateTime(vote?.cast_at),
      election: election
        ? {
            _id: election._id,
            title: election.title,
            type: election.type,
            status: election.status,
            faculty: election.faculty_id
              ? {
                  _id: election.faculty_id._id,
                  name: election.faculty_id.name,
                  code: election.faculty_id.code,
                }
              : null,
          }
        : null,
      candidate: candidate
        ? {
            _id: candidate._id,
            position: candidate.position,
            student: candidateStudent
              ? {
                  _id: candidateStudent._id,
                  full_name: candidateStudent.full_name,
                  faculty: candidateStudent.faculty_id
                    ? {
                        _id: candidateStudent.faculty_id._id,
                        name: candidateStudent.faculty_id.name,
                        code: candidateStudent.faculty_id.code,
                      }
                    : null,
                }
              : null,
          }
        : null,
    };
  });

export const computeElectionStatus = (
  election,
  statusEnum,
  timezone = DEFAULT_TIMEZONE
) => {
  if (!election || !statusEnum) return election?.status ?? null;

  const { INACTIVE, UPCOMING, ACTIVE, CLOSED } = statusEnum;

  if (election.status === INACTIVE) return INACTIVE;

  if (!election.start_time || !election.end_time) {
    return election.status ?? null;
  }

  const now = moment.tz(timezone);
  const start = moment.tz(election.start_time, timezone);
  const end = moment.tz(election.end_time, timezone);

  if (now.isBefore(start)) return UPCOMING;
  if (now.isBetween(start, end, null, "[)")) return ACTIVE;
  return CLOSED;
};

export const formatAdminOutput = (adminObj) => {
  if (!adminObj || typeof adminObj !== "object") return adminObj;
  const admin = { ...adminObj };
  admin.created_at = formatDateTime(admin.created_at);
  admin.updated_at = formatDateTime(admin.updated_at);
  admin.last_login = formatDateTime(admin.last_login);
  admin.last_logout = formatDateTime(admin.last_logout);
  admin.attempt_login_time = formatDateTime(admin.attempt_login_time);
  return admin;
};

export const formatStudentOutput = (studentObj) => {
  if (!studentObj || typeof studentObj !== "object") return studentObj;
  const student = { ...studentObj };
  student.created_at = formatDateTime(student.created_at);
  student.updated_at = formatDateTime(student.updated_at);
  student.attempt_login_time = formatDateTime(student.attempt_login_time);
  student.last_login = formatDateTime(student.last_login);
  student.last_logout = formatDateTime(student.last_logout);
  student.has_voted = mapHasVoted(student.has_voted);
  return student;
};
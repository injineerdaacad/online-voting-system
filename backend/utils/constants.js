export const UserRoleEnum = Object.freeze({
  SUPER_ADMIN: "Super Admin",
  FACULTY_ADMIN: "Faculty Admin",
  STUDENT: "Student",

  values: function() {
    return [this.SUPER_ADMIN, this.FACULTY_ADMIN, this.STUDENT];
  }
});

export const UserStatusEnum = Object.freeze({
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  GRADUATED: "Graduated",
  SUSPENDED: "Suspended",

  values: function() {
    return [this.ACTIVE, this.INACTIVE, this.GRADUATED, this.SUSPENDED];
  }
});

export const ElectionTypeEnum = Object.freeze({
  FACULTY_LEADERSHIP_ELECTION: "Faculty Leadership Election",
  STUDENT_UNION_ELECTION: "Student Union Election",

  values: function() {
    return [this.FACULTY_LEADERSHIP_ELECTION, this.STUDENT_UNION_ELECTION];
  }
});

export const ElectionStatusEnum = Object.freeze({
  UPCOMING: "Upcoming",
  ACTIVE: "Active",
  CLOSED: "Closed",
  INACTIVE: "Inactive",

  values: function() {
    return [this.UPCOMING, this.ACTIVE, this.CLOSED, this.INACTIVE];
  }
});
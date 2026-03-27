export const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  FACULTY_ADMIN: 'Faculty Admin',
  STUDENT: 'Student',
} as const;

export const USER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  GRADUATED: 'Graduated',
  SUSPENDED: 'Suspended',
} as const;

export const ELECTION_TYPES = {
  FACULTY_LEADERSHIP: 'Faculty Leadership Election',
  STUDENT_UNION: 'Student Union Election',
} as const;

export const ELECTION_STATUS = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  INACTIVE: 'Inactive',
} as const;

export const ELECTION_POSITIONS = {
  GUDOMIIYE: 'Gudoomiye',
  GUDOMIIYE_KU_XIGEEN: 'Gudoomiye Ku Xigeen',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    ADMIN_LOGIN: '/api/auth/admin/login',
    ADMIN_LOGOUT: '/api/auth/admin/logout',
    STUDENT_LOGIN: '/api/auth/student/login',
    STUDENT_LOGOUT: '/api/auth/student/logout',
    UNLOCK_USER: '/api/auth/unlock',
  },
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    LOCKED: '/api/users/locked',
    ADD: '/api/users/add',
    CHANGE_PASSWORD: '/api/users/change-password',
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,
  },
  FACULTIES: {
    BASE: '/api/faculties',
    ADD: '/api/faculties/add',
    BY_ID: (id: string) => `/api/faculties/${id}`,
  },
  DEPARTMENTS: {
    BASE: '/api/departments',
    ADD: '/api/departments/add',
    BY_ID: (id: string) => `/api/departments/${id}`,
  },
  ELECTIONS: {
    BASE: '/api/elections',
    CREATE: '/api/elections/create',
    BY_ID: (id: string) => `/api/elections/${id}`,
    ELIGIBLE: (studentId: string) => `/api/elections/eligible/${studentId}`,
  },
  CANDIDATES: {
    BASE: '/api/candidates',
    ADD: '/api/candidates/add',
    BY_ID: (id: string) => `/api/candidates/${id}`,
    BY_ELECTION: (electionId: string) => `/api/candidates/by-election/${electionId}`,
  },
  VOTES: {
    BASE: '/api/votes',
    VOTE: '/api/votes/voteForCandidate',
  },
  RESULTS: {
    BASE: '/api/results',
    BY_ELECTION: (electionId: string) => `/api/results/${electionId}`,
  },
} as const;

export const ROUTES = {
  HOME: '/',
  SIGNIN: '/signin',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ADMINS: '/admins',
  LOCKED_ADMINS: '/locked-admins',
  FACULTIES: '/faculties',
  DEPARTMENTS: '/departments',
  STUDENTS: '/students',
  ELECTIONS: '/elections',
  CANDIDATES: '/candidates',
  RESULTS: '/results',
  NOT_FOUND: '/error-404',
  SERVER_ERROR: '/error-500',
} as const;

export const TABLE_COLUMNS = {
  USER: ['name', 'email', 'role', 'status', 'createdAt', 'actions'],
  ELECTION: ['title', 'type', 'status', 'startDate', 'endDate', 'actions'],
  CANDIDATE: ['name', 'position', 'faculty', 'votes', 'actions'],
  RESULT: ['position', 'candidate', 'votes', 'percentage'],
} as const;

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'MMM DD, YYYY HH:mm',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

export const BRAND_COLORS = {
  GOLD: {
    25: '#fefdf8',
    50: '#fdf9e7',
    100: '#faf1c7',
    200: '#f5e19c',
    300: '#edc96b',
    400: '#e4b03e',
    500: '#d4a017',
    600: '#b88a0e',
    700: '#9c7309',
    800: '#805c06',
    900: '#644504',
    950: '#482e02',
  },
  BLUE: {
    25: '#f0f9ff',
    50: '#e0f2fe',
    100: '#b9e6fe',
    200: '#7cd4fd',
    300: '#36bffa',
    400: '#0ba5ec',
    500: '#0086c9',
    600: '#026aa2',
    700: '#065986',
    800: '#0b4a6f',
    900: '#062c41',
    950: '#031a28',
  },
  RED: {
    25: '#fffbfa',
    50: '#fef3f2',
    100: '#fee4e2',
    200: '#fecdca',
    300: '#fda29b',
    400: '#f97066',
    500: '#f04438',
    600: '#d92d20',
    700: '#b42318',
    800: '#912018',
    900: '#7a271a',
    950: '#55160c',
  },
  PINK: {
    25: '#fef7f7',
    50: '#fdeef0',
    100: '#fbdde2',
    200: '#f7bcc6',
    300: '#f195a5',
    400: '#e86b82',
    500: '#dd4a67',
    600: '#c93d5a',
    700: '#a8324a',
    800: '#8a2c3d',
    900: '#722a35',
    950: '#3f1419',
  },
} as const;

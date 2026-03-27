export class HttpError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'HttpError';
  }
}

export const assertCondition = (
  condition: boolean, 
  statusCode: number, 
  message: string, 
  details?: any
): void => {
  if (!condition) {
    throw new HttpError(statusCode, message, details);
  }
};

export const ensureValidObjectId = (value: string, label: string = "id"): string => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  assertCondition(
    objectIdRegex.test(value),
    400,
    `Invalid ${label} format`
  );
  return value;
};

export const ensureValidObjectIds = (values: string[] = [], label: string = "ids"): string[] => {
  const invalidIndex = values.findIndex(
    (value) => !/^[0-9a-fA-F]{24}$/.test(value)
  );
  assertCondition(
    invalidIndex === -1,
    400,
    `Invalid ${label}${invalidIndex >= 0 ? ` at index ${invalidIndex}` : ""}`
  );
  return values;
};

export const isSuperAdmin = (user: any): boolean => 
  user?.role === 'super-admin';

export const assertSuperAdmin = (
  user: any,
  message: string = "Only Super Admins can perform this action"
): void => {
  assertCondition(isSuperAdmin(user), 403, message);
};

export const isFacultyAdmin = (user: any): boolean => 
  user?.role === 'admin';

export const assertFacultyAdmin = (
  user: any,
  message: string = "Only Faculty Admins can perform this action"
): void => {
  assertCondition(
    isSuperAdmin(user) || isFacultyAdmin(user),
    403,
    message
  );
};

export const isStudent = (user: any): boolean => 
  user?.role === 'student';

export const handleControllerError = (
  error: any,
  defaultMessage: string = "An error occurred"
): HttpError => {
  if (error instanceof HttpError) {
    return error;
  }
  
  if (error.response?.data?.error) {
    return new HttpError(
      error.response.status || 500,
      error.response.data.error,
      error.response.data
    );
  }
  
  if (error.message) {
    return new HttpError(500, error.message);
  }
  
  return new HttpError(500, defaultMessage);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

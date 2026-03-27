import mongoose from "mongoose";
import { AdminRoleEnum } from "../models/index.js";
import { uploadImageToCloudinary } from "./imageUploader.js";
import {
  DEFAULT_TIMEZONE,
  normalizeString,
  toCapitalize,
  formatDateTime,
  toDateInTimeZone,
  formatDateInTimeZone,
  mapHasVoted,
  formatVotingHistory,
  computeElectionStatus,
  formatAdminOutput,
  formatStudentOutput,
} from "./formatters.js";

export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const assertCondition = (condition, statusCode, message, details) => {
  if (!condition) {
    throw new HttpError(statusCode, message, details);
  }
};

export const ensureValidObjectId = (value, label = "id") => {
  assertCondition(
    mongoose.Types.ObjectId.isValid(value),
    400,
    `Invalid ${label}`
  );
  return value;
};

export const ensureValidObjectIds = (values = [], label = "ids") => {
  const invalidIndex = values.findIndex(
    (value) => !mongoose.Types.ObjectId.isValid(value)
  );
  assertCondition(
    invalidIndex === -1,
    400,
    `Invalid ${label}${invalidIndex >= 0 ? ` at index ${invalidIndex}` : ""}`
  );
  return values;
};

export const isSuperAdmin = (user) => user?.role === AdminRoleEnum.SUPER_ADMIN;

export const assertSuperAdmin = (
  user,
  message = "Only Super Admins can perform this action"
) => {
  assertCondition(isSuperAdmin(user), 403, message);
};

export const assertFacultyScope = (
  user,
  facultyId,
  message = "You can only act on your own faculty"
) => {
  if (isSuperAdmin(user)) return;
  assertCondition(
    user?.faculty_id && user.faculty_id.toString() === facultyId?.toString(),
    403,
    message
  );
};

export const handleControllerError = (
  res,
  err,
  fallbackMessage = "Server error"
) => {
  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const payload = {
    error:
      statusCode === 500 ? fallbackMessage : err?.message || fallbackMessage,
  };

  if (err?.details && statusCode !== 500) {
    payload.details = err.details;
  }

  return res.status(statusCode).json(payload);
};

export { uploadImageToCloudinary };

export {
  DEFAULT_TIMEZONE,
  normalizeString,
  toCapitalize,
  formatDateTime,
  toDateInTimeZone,
  formatDateInTimeZone,
  mapHasVoted,
  formatVotingHistory,
  computeElectionStatus,
  formatAdminOutput,
  formatStudentOutput,
};
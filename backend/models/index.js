export {
  User,
  Admin,
  Student
} from "./userModel.js";

export { Faculty } from "./facultyModel.js";
export { Department } from "./departmentModel.js";
export { Election } from "./electionModel.js";
export { Candidate } from "./candidateModel.js";
export { Vote } from "./voteModel.js";
export { Notification } from "./notificationModel.js";

export {
  UserRoleEnum,
  UserStatusEnum,
  ElectionTypeEnum,
  ElectionStatusEnum
} from "../utils/constants.js";

import { UserRoleEnum, UserStatusEnum } from "../utils/constants.js";

export const AdminRoleEnum = {
  SUPER_ADMIN: UserRoleEnum.SUPER_ADMIN,
  ADMIN: UserRoleEnum.FACULTY_ADMIN,
  values: () => [UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY_ADMIN]
};

export const StudentRoleEnum = {
  STUDENT: UserRoleEnum.STUDENT,
  values: () => [UserRoleEnum.STUDENT]
};

export const StudentStatusEnum = UserStatusEnum;
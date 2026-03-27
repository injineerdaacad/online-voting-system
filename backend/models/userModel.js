import mongoose from 'mongoose';
import { UserRoleEnum, UserStatusEnum } from '../utils/constants.js';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    student_id: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function() {
        return this.isNew;
      },
      minlength: 6,
    },

    password_hash: {
      type: String,
      required: false,
    },

    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: UserRoleEnum.values(),
      required: true,
      default: UserRoleEnum.STUDENT,
    },

    status: {
      type: String,
      enum: UserStatusEnum.values(),
      default: UserStatusEnum.ACTIVE,
    },

    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: function() {
        return this.role !== UserRoleEnum.SUPER_ADMIN;
      }
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function() {
        return this.role === UserRoleEnum.STUDENT;
      }
    },

    batch: {
      type: String,
      required: function() {
        return this.role === UserRoleEnum.STUDENT;
      }
    },

    graduation_year: {
      type: Number,
    },

    has_voted: [
      {
        election_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Election",
        },
        voted_at: {
          type: Date,
        },
      },
    ],

    attempt_login: {
      type: Number,
      default: 0,
    },

    attempt_login_time: {
      type: Date,
    },

    is_locked: {
      type: Boolean,
      default: false,
    },

    is_login: {
      type: Boolean,
      default: false,
    },

    last_login: Date,

    last_logout: Date,

    photo_url: String,

    photo_id: String,

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.index({ role: 1 });
UserSchema.index({ faculty_id: 1 });
UserSchema.index({ status: 1 });

UserSchema.virtual('is_admin').get(function() {
  return this.role === UserRoleEnum.SUPER_ADMIN || this.role === UserRoleEnum.FACULTY_ADMIN;
});

UserSchema.virtual('is_student').get(function() {
  return this.role === UserRoleEnum.STUDENT;
});

UserSchema.pre('save', function (next) {
  if (this.role === UserRoleEnum.SUPER_ADMIN && this.faculty_id) {
    this.faculty_id = undefined;
  }

  if (this.is_admin && !this.username) {
    return next(new Error('Username is required for admin users'));
  }

  if (this.is_student && !this.student_id) {
    return next(new Error('Student ID is required for student users'));
  }
  next();
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    this.password_hash = await bcrypt.hash(this.password, saltRounds);
    this.password = undefined;
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.pre('validate', function (next) {
  if (this.isNew && this.password) {
    return next();
  }
  if (this.isNew && !this.password) {
    return next(new Error('Password is required for new users'));
  }
  if (!this.isNew && !this.password_hash) {
    return next(new Error('Password hash is required for existing users'));
  }
  next();
});

export const User = mongoose.model('User', UserSchema);

export { User as Admin };
export { User as Student };

export default User;
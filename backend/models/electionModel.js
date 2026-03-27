import mongoose from "mongoose";
import { ElectionTypeEnum, ElectionStatusEnum } from '../utils/constants.js';

const ElectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: String,

    type: {
      type: String,
      enum: ElectionTypeEnum.values(),
      required: true
    },

    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },

    start_time: Date,

    end_time: Date,

    status: {
      type: String,
      enum: ElectionStatusEnum.values(),
      default: ElectionStatusEnum.UPCOMING,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

  },

  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }

);

ElectionSchema.index({ status: 1 });
ElectionSchema.index({ faculty_id: 1 });
ElectionSchema.index({ start_time: 1, end_time: 1 });

export const Election = mongoose.model("Election", ElectionSchema);
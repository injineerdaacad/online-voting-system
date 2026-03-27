import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    election_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true
    },

    position: {
      type: String,
      required: true
    },

  manifesto: String,

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
  },

  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }

);

CandidateSchema.index({ election_id: 1 });
CandidateSchema.index({ student_id: 1 });
CandidateSchema.index({ election_id: 1, student_id: 1 }, { unique: true });

export const Candidate = mongoose.model("Candidate", CandidateSchema);
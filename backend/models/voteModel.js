import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    election_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },

    voter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    votes: [
      {
        candidate_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Candidate",
          required: true,
        },
        position: {
          type: String,
          required: true,
          validate: {
            validator: function(v) {
              return v && v.trim().length > 0;
            },
            message: 'Position cannot be empty or whitespace only'
          }
        },
      }
    ],

    cast_at: {
      type: Date,
      default: Date.now
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
  },

  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }

);

VoteSchema.index({ election_id: 1 });
VoteSchema.index({ "votes.candidate_id": 1 });

VoteSchema.index(
  { voter_id: 1, election_id: 1 },
  { unique: true }
);

export const Vote = mongoose.model("Vote", VoteSchema);
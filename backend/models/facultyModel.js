import mongoose from 'mongoose';

const FacultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true],
      unique: true,
      minlength: [3],
      maxlength: [100],
    },

    code: {
      type: String,
      required: [true],
      unique: true,
      minlength: [2],
      maxlength: [10],
    },

    departments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    }],

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

export const Faculty = mongoose.model('Faculty', FacultySchema);
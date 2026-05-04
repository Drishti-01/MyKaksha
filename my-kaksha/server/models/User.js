// Mongoose Schema — defines structure of MongoDB collection
// MongoDB is schema-less but Mongoose adds structure and validation
// required: true — field must exist or save/create will throw ValidationError
// default: value — used if field not provided in the document
// index: true — speeds up queries on this field (creates a B-tree index)
// Concept 9 — MongoDB + Mongoose (Backend Engineering-I Eval-II)

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);

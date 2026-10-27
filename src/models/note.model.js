import { Schema } from "mongoose";
import { model } from "mongoose";

const projectNoteschema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15000,
    },
  },
  { timestamps: true },
);

const Note = model("Note", projectNoteschema);

export default Note;

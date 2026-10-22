import { Schema } from "mongoose";
import { model } from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

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

      default: "",
    },
  },
  { timestamps: true },
);

export const Note = model("Note", projectNoteschema);

import { Schema } from "mongoose";
import { model } from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: AvailableTaskStatus,
      default: TaskStatusEnum.TODO,
    },

    attachments: {
      type: [
        {
          url: String,
          mimetype: String,
          publicId: String,
          size: Number,
        },
      ],

      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Task = model("Task", taskSchema);

export default Task;

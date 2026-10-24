import { Schema } from "mongoose";
import { model } from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const subtaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    status: {
      type: String,
      enum: AvailableTaskStatus,
      default: TaskStatusEnum.TODO,
    },
  },
  {
    timestamps: true,
  },
);

 const Subtask = model("Subtask", subtaskSchema);


 export default Subtask;
// later addition

// assignedTo	⚖️ Optional	If subtasks can be delegated
// description	⚖️ Optional	Adds detail
// priority	⚖️ Optional	Helps ordering
// dueDate	⚖️ Optional	Independent deadlines

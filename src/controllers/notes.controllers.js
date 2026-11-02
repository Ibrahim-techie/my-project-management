import Note from "../models/note.model.js";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import mongoose from "mongoose";
import { emitToProject } from "../socket/index.js";

// Every note route runs roleProjectPermission first, which already requires a
// membership in this project, and memberships are deleted with the project.
// So the project is known to exist here and needs no extra lookup.

const noteFilter = (projectId, noteId) => ({
  _id: new mongoose.Types.ObjectId(noteId),
  project: new mongoose.Types.ObjectId(projectId),
});

const createNote = asynchandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  const note = await Note.create({
    project: new mongoose.Types.ObjectId(projectId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
    content,
  });

  emitToProject(projectId, "note:created", note);

  return res
    .status(201)
    .json(new ApiResponse(201, "Note Created Successfully ", note));
});

const getNotes = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const notes = await Note.find({
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (notes.length === 0) {
    return res.status(200).json(new ApiResponse(200, "No Notes Found", []));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Notes Fetched Successfully ", notes));
});

const updateNote = asynchandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  const note = await Note.findOneAndUpdate(
    noteFilter(projectId, noteId),
    {
      $set: {
        ...(content !== undefined && { content }),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!note) {
    throw new ApiError(404, "Note Not Found to Update");
  }

  emitToProject(projectId, "note:updated", note);

  return res
    .status(200)
    .json(new ApiResponse(200, "Note updated successfully", note));
});

const deleteNote = asynchandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const note = await Note.findOneAndDelete(noteFilter(projectId, noteId));

  if (!note) {
    throw new ApiError(404, "Note not found to delete");
  }

  emitToProject(projectId, "note:deleted", { projectId, noteId: note._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "Note deleted successfully", note));
});

const getNoteById = asynchandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const note = await Note.findOne(noteFilter(projectId, noteId));

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Note fetched successfully", note));
});

export { createNote, getNotes, updateNote, deleteNote, getNoteById };

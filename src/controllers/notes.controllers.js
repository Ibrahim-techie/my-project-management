import Note from "../models/note.model.js";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import Project from "../models/project.models.js";
import mongoose from "mongoose";

const createNote = asynchandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  const project = await Project.exists({
    _id: new mongoose.Types.ObjectId(projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project Not Found to Add Notes");
  }

  const note = await Note.create({
    project: new mongoose.Types.ObjectId(projectId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
    content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Note Created Successfully ", note));
});

const getNotes = asynchandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.exists({
    _id: new mongoose.Types.ObjectId(projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project Not Found to Get Notes");
  }

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

  const project = await Project.exists({
    _id: new mongoose.Types.ObjectId(projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project Not Found to Add Notes");
  }

  const note = await Note.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(noteId),
      project: new mongoose.Types.ObjectId(projectId),
    },
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

  return res
    .status(200)
    .json(new ApiResponse(200, "Note updated successfully", note));
});

const deleteNote = asynchandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const project = await Project.exists({
    _id: new mongoose.Types.ObjectId(projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project Not Found to Add Notes");
  }

  const note = await Note.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(noteId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!note) {
    throw new ApiError(404, "Note not found to delete");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Note deleted successfully", note));
});

const getNoteById = asynchandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const project = await Project.exists({
    _id: new mongoose.Types.ObjectId(projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project Not Found to Add Notes");
  }

  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Note fetched successfully", note));
});
export { createNote, getNotes, updateNote, deleteNote,getNoteById };

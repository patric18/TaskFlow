import * as projectService from '../services/projectService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user.id, req.query);
  res.json({ projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.user.id, req.params.id);
  res.json({ project });
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  res.status(201).json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
  res.json({ project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(req.user.id, req.params.id);
  res.json(result);
});

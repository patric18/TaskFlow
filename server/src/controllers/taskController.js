import * as taskService from '../services/taskService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user.id, req.query);
  res.json({ tasks });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.user.id, req.params.id);
  res.json({ task });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
  res.json({ task });
});

export const updateTaskPosition = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskPosition(req.user.id, req.params.id, req.body);
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.user.id, req.params.id);
  res.json(result);
});

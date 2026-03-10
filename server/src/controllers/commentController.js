import * as commentService from '../services/commentService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listComments = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(req.user.id, req.params.id);
  res.json({ comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.user.id, req.params.id, req.body);
  res.status(201).json({ comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const result = await commentService.deleteComment(req.user.id, req.params.id);
  res.json(result);
});

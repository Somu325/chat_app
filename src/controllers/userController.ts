import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const searchUsers = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { q } = req.query;
  if (!q) return next(new ApiError(400, 'Please provide a search query'));

  const users = await User.find({
    username: { $regex: q, $options: 'i' },
    _id: { $ne: req.user.id }
  }).select('username avatar isOnline');

  res.status(200).json({ success: true, data: users });
});

export const getUserProfile = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.userId).select('username avatar isOnline lastSeen createdAt');
  if (!user) return next(new ApiError(404, 'User not found'));

  res.status(200).json({ success: true, data: user });
});

export const getOnlineUsers = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const users = await User.find({ isOnline: true }).select('_id username avatar isOnline');
  res.status(200).json({ success: true, data: users });
});

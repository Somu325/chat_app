import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { Room } from '../models/Room';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getPagination } from '../utils/pagination';

export const getMessages = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const room = await Room.findById(roomId);
  if (!room) return next(new ApiError(404, 'Room not found'));

  const isMember = room.members.some((m: any) => m.userId.toString() === req.user.id);
  if (!isMember) return next(new ApiError(403, 'Not authorized to view messages in this room'));

  const { skip, limit: parsedLimit } = getPagination(Number(page), Number(limit));

  const messages = await Message.find({ roomId })
    .populate('senderId', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  res.status(200).json({ success: true, data: messages.reverse() });
});

export const sendMessage = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { roomId } = req.params;
  const { content, type } = req.body;

  const message = await Message.create({
    roomId,
    senderId: req.user.id,
    content,
    type: type || 'text'
  });

  res.status(201).json({ success: true, data: message });
});

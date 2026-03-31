import { Request, Response, NextFunction } from 'express';
import { Room } from '../models/Room';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const getGroups = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const rooms = await Room.find({
    type: { $in: ['global', 'group'] },
    'members.userId': req.user.id
  }).populate('members.userId', 'username avatar isOnline');
  res.status(200).json({ success: true, data: rooms });
});

export const getDMs = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const rooms = await Room.find({
    type: 'dm',
    'members.userId': req.user.id
  }).populate('members.userId', 'username avatar isOnline');
  res.status(200).json({ success: true, data: rooms });
});

export const createGroup = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { name, description, memberIds } = req.body;
  
  const members = [{ userId: req.user.id, role: 'admin' }];
  if (memberIds && Array.isArray(memberIds)) {
    memberIds.forEach(id => {
      if (id !== req.user.id) members.push({ userId: id, role: 'member' });
    });
  }

  const room = await Room.create({
    name,
    description,
    type: 'group',
    members,
    createdBy: req.user.id
  });

  res.status(201).json({ success: true, data: room });
});

export const startDM = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { targetUserId } = req.body;

  if (targetUserId === req.user.id) {
    return next(new ApiError(400, 'Cannot start DM with yourself'));
  }

  let room = await Room.findOne({
    type: 'dm',
    $and: [
      { 'members.userId': req.user.id },
      { 'members.userId': targetUserId }
    ]
  });

  if (!room) {
    room = await Room.create({
      type: 'dm',
      members: [
        { userId: req.user.id, role: 'member' },
        { userId: targetUserId, role: 'member' }
      ],
      createdBy: req.user.id
    });
  }

  res.status(200).json({ success: true, data: room });
});

export const getRoomMembers = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const room = await Room.findById(req.params.roomId).populate('members.userId', 'username avatar isOnline lastSeen');
  if (!room) return next(new ApiError(404, 'Room not found'));

  const isMember = room.members.some((m: any) => m.userId._id.toString() === req.user.id);
  if (!isMember) return next(new ApiError(403, 'Not authorized to view members of this room'));

  res.status(200).json({ success: true, data: room.members });
});

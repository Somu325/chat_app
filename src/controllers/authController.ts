import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import jwt from 'jsonwebtoken';

const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_here', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    }
  });
};

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;
  const user = await User.create({ username, email, password });
  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ApiError(400, 'Please provide email and password'));

  const user: any = await User.findOne({ email }).select('+password');
  if (!user) return next(new ApiError(401, 'Invalid credentials'));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new ApiError(401, 'Invalid credentials'));

  sendTokenResponse(user, 200, res);
});

export const getMe = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
});

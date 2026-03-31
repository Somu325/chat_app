import express from 'express';
import { searchUsers, getUserProfile, getOnlineUsers } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/online', getOnlineUsers);
router.get('/:userId', getUserProfile);

export default router;

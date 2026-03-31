import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body } from 'express-validator';

const router = express.Router();

router.use(protect);

router.get('/:roomId', getMessages);

router.post('/:roomId', [
  body('content').notEmpty().withMessage('Message content is required')
], validate, sendMessage);

export default router;

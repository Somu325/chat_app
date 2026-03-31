import express from 'express';
import { getGroups, getDMs, createGroup, startDM, getRoomMembers } from '../controllers/roomController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body } from 'express-validator';

const router = express.Router();

router.use(protect);

router.get('/groups', getGroups);
router.get('/dms', getDMs);

router.post('/group', [
  body('name').notEmpty().withMessage('Group name is required'),
  body('memberIds').isArray().withMessage('Member IDs must be an array')
], validate, createGroup);

router.post('/dm', [
  body('targetUserId').notEmpty().withMessage('Target user ID is required')
], validate, startDM);

router.get('/:roomId/members', getRoomMembers);

export default router;

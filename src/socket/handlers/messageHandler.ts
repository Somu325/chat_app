import { Socket } from 'socket.io';
import { Message } from '../../models/Message';
import { Room } from '../../models/Room';

export const handleMessages = (socket: Socket, io: any) => {
  socket.on('send_message', async (data) => {
    try {
      const { roomId, content, type } = data;
      const user = (socket as any).user;

      const room = await Room.findById(roomId);
      if (!room) return socket.emit('error', { message: 'Room not found' });

      const isMember = room.members.some((m: any) => m.userId.toString() === user._id.toString());
      if (!isMember) return socket.emit('error', { message: 'Not a member of this room' });

      const message = await Message.create({
        roomId,
        senderId: user._id,
        content,
        type: type || 'text'
      });

      const populatedMessage = await Message.findById(message._id).populate('senderId', 'username avatar');

      io.to(roomId).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('mark_read', async (data) => {
    try {
      const { messageId } = data;
      const user = (socket as any).user;

      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: { userId: user._id, readAt: new Date() } }
      });

      // Optionally emit an event to update read receipts
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });
};

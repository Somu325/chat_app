import { Socket } from 'socket.io';
import { Room } from '../../models/Room';

export const handleRooms = (socket: Socket, io: any) => {
  socket.on('join_room', async (data) => {
    try {
      const { roomId } = data;
      const user = (socket as any).user;

      const room = await Room.findById(roomId);
      if (!room) return socket.emit('error', { message: 'Room not found' });

      const isMember = room.members.some((m: any) => m.userId.toString() === user._id.toString());
      if (!isMember) return socket.emit('error', { message: 'Not a member of this room' });

      socket.join(roomId);
      socket.emit('room_joined', { roomId });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
};

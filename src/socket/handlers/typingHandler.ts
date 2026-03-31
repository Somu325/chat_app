import { Socket } from 'socket.io';

export const handleTyping = (socket: Socket, io: any) => {
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    const user = (socket as any).user;

    socket.to(roomId).emit('typing_indicator', {
      roomId,
      userId: user._id,
      username: user.username,
      isTyping
    });
  });
};

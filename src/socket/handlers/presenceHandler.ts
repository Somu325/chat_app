import { Socket } from 'socket.io';
import { User } from '../../models/User';

export const handlePresence = (socket: Socket, io: any) => {
  socket.on('disconnect', async () => {
    try {
      const user = (socket as any).user;
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          isOnline: false,
          lastSeen: new Date()
        });

        io.emit('user_offline', { userId: user._id, lastSeen: new Date() });
      }
    } catch (error) {
      console.error('Error handling disconnect presence:', error);
    }
  });

  socket.on('connect', async () => {
    try {
      const user = (socket as any).user;
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          isOnline: true
        });

        io.emit('user_online', { userId: user._id });
      }
    } catch (error) {
      console.error('Error handling connect presence:', error);
    }
  });
};

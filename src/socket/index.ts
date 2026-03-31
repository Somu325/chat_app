import { Socket } from 'socket.io';
import { handleMessages } from './handlers/messageHandler';
import { handleTyping } from './handlers/typingHandler';
import { handlePresence } from './handlers/presenceHandler';
import { handleRooms } from './handlers/roomHandler';
import { socketAuth } from './socketAuth';
import { User } from '../models/User';

export const initSocketHandlers = (io: any) => {
  io.use(socketAuth);

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.username} (${user._id})`);

    // Update online status on connect
    await User.findByIdAndUpdate(user._id, { isOnline: true });
    io.emit('user_online', { userId: user._id });

    // Initialize handlers
    handleMessages(socket, io);
    handleTyping(socket, io);
    handlePresence(socket, io);
    handleRooms(socket, io);

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username} (${user._id})`);
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
      io.emit('user_offline', { userId: user._id, lastSeen: new Date() });
    });
  });
};

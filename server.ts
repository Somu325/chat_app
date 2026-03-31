import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db';
import { initSocketHandlers } from './src/socket';
import authRoutes from './src/routes/authRoutes';
import roomRoutes from './src/routes/roomRoutes';
import messageRoutes from './src/routes/messageRoutes';
import userRoutes from './src/routes/userRoutes';
import { errorHandler } from './src/middleware/errorHandler';
import { Room } from './src/models/Room';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const httpServer = createServer(app);
  
  // Connect to Database
  await connectDB();

  // Socket.IO Setup
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  initSocketHandlers(io);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for Vite dev server
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }));
  app.use(morgan('dev'));

  // Seed Global Room
  const seedGlobalRoom = async () => {
    try {
      const globalRoom = await Room.findOne({ type: 'global' });
      if (!globalRoom) {
        await Room.create({
          name: 'Global Chat',
          description: 'Welcome to the global chat room!',
          type: 'global',
          members: []
        });
        console.log('Global room seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding global room:', error);
    }
  };
  seedGlobalRoom();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/users', userRoutes);

  // Error Handler Middleware
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// In-memory data store
const users: any[] = [];
const rooms: any[] = [
  { id: 'global', name: 'Global Chat', type: 'global', members: [] }
];
const messages: any[] = [];

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), username, email, password: hashedPassword, online: false };
    users.push(newUser);
    
    // Auto-join global room
    const globalRoom = rooms.find(r => r.id === 'global');
    if (globalRoom && !globalRoom.members.includes(newUser.id)) {
      globalRoom.members.push(newUser.id);
    }

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true });
    res.json({ user: { id: newUser.id, username: newUser.username, email: newUser.email }, token });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true });
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  // Middleware to protect routes
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  app.get('/api/users/search', authenticate, (req: any, res) => {
    const q = req.query.q?.toString().toLowerCase() || '';
    const results = users
      .filter(u => u.username.toLowerCase().includes(q) && u.id !== req.user.id)
      .map(u => ({ id: u.id, username: u.username, online: u.online }));
    res.json(results);
  });

  app.get('/api/users/online', authenticate, (req: any, res) => {
    const onlineUserIds = users.filter(u => u.online).map(u => u.id);
    res.json(onlineUserIds);
  });

  app.get('/api/rooms/groups', authenticate, (req: any, res) => {
    const userGroups = rooms.filter(r => r.type !== 'dm' && r.members.includes(req.user.id));
    res.json(userGroups);
  });

  app.get('/api/rooms/dms', authenticate, (req: any, res) => {
    const userDms = rooms.filter(r => r.type === 'dm' && r.members.includes(req.user.id));
    // Add target user info to DM
    const enrichedDms = userDms.map(dm => {
      const targetUserId = dm.members.find((m: string) => m !== req.user.id);
      const targetUser = users.find(u => u.id === targetUserId);
      return { ...dm, name: targetUser?.username || 'Unknown User', targetUser };
    });
    res.json(enrichedDms);
  });

  app.post('/api/rooms/group', authenticate, (req: any, res) => {
    const { name, description, invitees } = req.body;
    const newGroup = {
      id: Date.now().toString(),
      name,
      description,
      type: 'group',
      members: [req.user.id, ...(invitees || [])]
    };
    rooms.push(newGroup);
    res.json(newGroup);
  });

  app.post('/api/rooms/dm', authenticate, (req: any, res) => {
    const { targetUserId } = req.body;
    // Check if DM already exists
    let dm = rooms.find(r => r.type === 'dm' && r.members.includes(req.user.id) && r.members.includes(targetUserId));
    if (!dm) {
      dm = {
        id: Date.now().toString(),
        type: 'dm',
        members: [req.user.id, targetUserId]
      };
      rooms.push(dm);
    }
    const targetUser = users.find(u => u.id === targetUserId);
    res.json({ ...dm, name: targetUser?.username, targetUser });
  });

  app.get('/api/messages/:roomId', authenticate, (req: any, res) => {
    const { roomId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    
    const roomMessages = messages.filter(m => m.roomId === roomId).sort((a, b) => b.timestamp - a.timestamp);
    const start = (page - 1) * limit;
    const paginated = roomMessages.slice(start, start + limit).reverse();
    
    res.json(paginated);
  });

  // Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (e) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    const dbUser = users.find(u => u.id === user.id);
    if (dbUser) {
      dbUser.online = true;
      io.emit('user_online', { userId: user.id });
    }

    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('send_message', ({ roomId, content, type }) => {
      const message = {
        id: Date.now().toString(),
        roomId,
        content,
        type,
        senderId: user.id,
        senderName: user.username,
        timestamp: Date.now(),
        readBy: [user.id]
      };
      messages.push(message);
      io.to(roomId).emit('receive_message', message);
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('typing_indicator', { roomId, userId: user.id, username: user.username, isTyping });
    });

    socket.on('mark_read', ({ roomId, messageId }) => {
      const msg = messages.find(m => m.id === messageId);
      if (msg && !msg.readBy.includes(user.id)) {
        msg.readBy.push(user.id);
        io.to(roomId).emit('message_read', { roomId, messageId, readBy: msg.readBy });
      }
    });

    socket.on('disconnect', () => {
      if (dbUser) {
        dbUser.online = false;
        io.emit('user_offline', { userId: user.id });
      }
    });
  });

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

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

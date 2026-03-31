import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import * as roomsApi from '../api/rooms';
import * as messagesApi from '../api/messages';
import * as usersApi from '../api/users';

interface ChatContextType {
  activeRoom: any | null;
  setActiveRoom: (room: any) => void;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  rooms: any[];
  setRooms: React.Dispatch<React.SetStateAction<any[]>>;
  typingUsers: { [roomId: string]: any[] };
  onlineUsers: Set<string>;
  unreadCounts: { [roomId: string]: number };
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
  loadingMessages: boolean;
}

export const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { socket, connected } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([{ id: 'global', name: 'Global Chat', type: 'global', members: [] }]);
  const [typingUsers, setTypingUsers] = useState<{ [roomId: string]: any[] }>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: string]: number }>({});
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch initial rooms
  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      try {
        const [groups, dms, onlineIds] = await Promise.all([
          roomsApi.getGroups(), 
          roomsApi.getDms(),
          usersApi.getOnlineUsers()
        ]);
        setRooms([{ id: 'global', name: 'Global Chat', type: 'global', members: [] }, ...groups, ...dms]);
        setOnlineUsers(new Set(onlineIds));
      } catch (e) {
        console.error('Failed to fetch rooms', e);
      }
    };
    fetchRooms();
  }, [user]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !connected) return;

    // Join all rooms on connect
    rooms.forEach(room => {
      socket.emit('join_room', { roomId: room.id });
    });

    const handleReceiveMessage = (message: any) => {
      if (activeRoom && message.roomId === activeRoom.id) {
        setMessages(prev => [...prev, message]);
        if (message.senderId !== user?.id) {
          socket.emit('mark_read', { roomId: message.roomId, messageId: message.id });
        }
      } else {
        setUnreadCounts(prev => ({ ...prev, [message.roomId]: (prev[message.roomId] || 0) + 1 }));
      }
    };

    const handleTyping = ({ roomId, userId, username, isTyping }: any) => {
      setTypingUsers(prev => {
        const roomTyping = prev[roomId] || [];
        if (isTyping) {
          if (!roomTyping.find(u => u.userId === userId)) {
            return { ...prev, [roomId]: [...roomTyping, { userId, username }] };
          }
        } else {
          return { ...prev, [roomId]: roomTyping.filter(u => u.userId !== userId) };
        }
        return prev;
      });
    };

    const handleUserOnline = ({ userId }: any) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    };

    const handleUserOffline = ({ userId }: any) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    const handleMessageRead = ({ roomId, messageId, readBy }: any) => {
      if (activeRoom && activeRoom.id === roomId) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, readBy } : m));
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_indicator', handleTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_indicator', handleTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('message_read', handleMessageRead);
    };
  }, [socket, connected, activeRoom, rooms, user]);

  // Load messages when active room changes
  useEffect(() => {
    if (!activeRoom) return;
    
    setUnreadCounts(prev => ({ ...prev, [activeRoom.id]: 0 }));
    setMessages([]);
    setPage(1);
    setHasMore(true);
    
    const fetchInitialMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await messagesApi.getMessages(activeRoom.id, 1, 30);
        setMessages(data);
        setHasMore(data.length === 30);
        setPage(2);
        
        // Mark unread messages as read
        data.forEach((msg: any) => {
          if (msg.senderId !== user?.id && !msg.readBy.includes(user?.id)) {
            socket?.emit('mark_read', { roomId: activeRoom.id, messageId: msg.id });
          }
        });
      } catch (e) {
        console.error('Failed to fetch messages', e);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchInitialMessages();
  }, [activeRoom, user, socket]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeRoom || !hasMore || loadingMessages) return;
    
    setLoadingMessages(true);
    try {
      const data = await messagesApi.getMessages(activeRoom.id, page, 30);
      setMessages(prev => [...data, ...prev]);
      setHasMore(data.length === 30);
      setPage(p => p + 1);
    } catch (e) {
      console.error('Failed to load more messages', e);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeRoom, page, hasMore, loadingMessages]);

  return (
    <ChatContext.Provider value={{
      activeRoom, setActiveRoom,
      messages, setMessages,
      rooms, setRooms,
      typingUsers,
      onlineUsers,
      unreadCounts,
      loadMoreMessages,
      hasMore,
      loadingMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
};

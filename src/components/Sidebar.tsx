import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { LogOut, Plus, MessageSquare, Hash, User as UserIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import CreateGroupModal from './CreateGroupModal';
import SearchUserModal from './SearchUserModal';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const { rooms, activeRoom, setActiveRoom, unreadCounts, onlineUsers } = useContext(ChatContext);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);

  const globalRoom = rooms.find(r => r.type === 'global');
  const groupRooms = rooms.filter(r => r.type === 'group');
  const dmRooms = rooms.filter(r => r.type === 'dm');

  return (
    <div className="w-64 bg-[#1c1c22] border-r border-white/5 flex flex-col h-full shrink-0">
      {/* User Profile */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1c22]"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{user?.username}</span>
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {/* Global Chat */}
        <div>
          <button
            onClick={() => setActiveRoom(globalRoom)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              activeRoom?.id === globalRoom?.id ? "bg-indigo-500/10 text-indigo-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Hash size={18} />
            <span className="font-medium">Global Chat</span>
            {unreadCounts['global'] > 0 && (
              <span className="ml-auto bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCounts['global']}
              </span>
            )}
          </button>
        </div>

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Groups</span>
            <button onClick={() => setIsCreateGroupOpen(true)} className="text-gray-400 hover:text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {groupRooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  activeRoom?.id === room.id ? "bg-indigo-500/10 text-indigo-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Hash size={18} />
                <span className="truncate">{room.name}</span>
                {unreadCounts[room.id] > 0 && (
                  <span className="ml-auto bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCounts[room.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</span>
            <button onClick={() => setIsSearchUserOpen(true)} className="text-gray-400 hover:text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {dmRooms.map(room => {
              const isOnline = onlineUsers.has(room.targetUser?.id);
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    activeRoom?.id === room.id ? "bg-indigo-500/10 text-indigo-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                      {room.name?.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1c1c22]"></div>
                    )}
                  </div>
                  <span className="truncate">{room.name}</span>
                  {unreadCounts[room.id] > 0 && (
                    <span className="ml-auto bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCounts[room.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
      <SearchUserModal isOpen={isSearchUserOpen} onClose={() => setIsSearchUserOpen(false)} />
    </div>
  );
}

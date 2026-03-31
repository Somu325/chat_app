import React, { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { Users, User as UserIcon, Hash } from 'lucide-react';
import { cn } from '../utils/cn';

export default function RightPanel() {
  const { activeRoom, onlineUsers } = useContext(ChatContext);

  if (!activeRoom) return null;

  return (
    <div className="w-64 bg-[#1c1c22] border-l border-white/5 flex flex-col h-full shrink-0">
      <div className="h-16 border-b border-white/5 flex items-center px-4">
        <h3 className="text-white font-medium">Details</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeRoom.type === 'dm' ? (
          <div className="flex flex-col items-center text-center space-y-4 pt-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-3xl font-medium">
                {activeRoom.name?.charAt(0).toUpperCase()}
              </div>
              {onlineUsers.has(activeRoom.targetUser?.id) && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#1c1c22]"></div>
              )}
            </div>
            <div>
              <h2 className="text-white font-medium text-xl">{activeRoom.name}</h2>
              <p className="text-gray-400 text-sm">{onlineUsers.has(activeRoom.targetUser?.id) ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Hash size={40} />
              </div>
              <div>
                <h2 className="text-white font-medium text-lg">{activeRoom.name}</h2>
                <p className="text-gray-400 text-sm">{activeRoom.description || 'No description'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users size={14} /> Members ({activeRoom.members?.length || 0})
              </h4>
              <div className="space-y-2">
                {activeRoom.members?.map((memberId: string) => {
                  const isOnline = onlineUsers.has(memberId);
                  return (
                    <div key={memberId} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs">
                          <UserIcon size={14} />
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1c1c22]"></div>
                        )}
                      </div>
                      <span className="text-sm text-gray-300 truncate">User {memberId.slice(-4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

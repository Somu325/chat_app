import React, { useState, useContext, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { ChatContext } from '../context/ChatContext';
import * as usersApi from '../api/users';
import * as roomsApi from '../api/rooms';

export default function SearchUserModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { setRooms, setActiveRoom } = useContext(ChatContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await usersApi.searchUsers(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartDm = async (targetUserId: string) => {
    setLoading(true);
    try {
      const dm = await roomsApi.startDm(targetUserId);
      setRooms(prev => {
        if (!prev.find(r => r.id === dm.id)) {
          return [...prev, dm];
        }
        return prev;
      });
      setActiveRoom(dm);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c22] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-medium text-white">New Direct Message</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users by username..."
              className="w-full bg-[#0f0f11] border border-white/5 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              autoFocus
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
            {searchResults.map(user => (
              <button
                key={user.id}
                onClick={() => handleStartDm(user.id)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1c22]"></div>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-200">{user.username}</span>
                    <span className="text-xs text-gray-500">{user.online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </button>
            ))}
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            )}
            {!searchQuery && (
              <div className="text-center text-gray-500 py-8">
                <p>Type a username to start searching</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

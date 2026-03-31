import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Send, Smile, Paperclip, Hash, Users, User as UserIcon, MessageSquare } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { formatMessageTime, formatMessageDate } from '../utils/formatTime';
import { groupByDate } from '../utils/groupByDate';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWindow() {
  const { activeRoom, messages, typingUsers, loadMoreMessages, hasMore, loadingMessages } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loadingMessages) {
      loadMoreMessages();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom || !socket) return;

    socket.emit('send_message', {
      roomId: activeRoom.id,
      content: input,
      type: activeRoom.type
    });

    setInput('');
    socket.emit('typing', { roomId: activeRoom.id, isTyping: false });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !activeRoom) return;
    
    socket.emit('typing', { roomId: activeRoom.id, isTyping: e.target.value.length > 0 });
  };

  const onEmojiClick = (emojiObject: any) => {
    setInput(prev => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f11] text-gray-500 flex-col gap-4">
        <MessageSquare size={48} className="opacity-20" />
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  const groupedMessages = groupByDate(messages);
  const activeTypingUsers = typingUsers[activeRoom.id]?.filter(u => u.userId !== user?.id) || [];

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f11] h-full relative">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-[#0f0f11]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {activeRoom.type === 'dm' ? (
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white">
              {activeRoom.name?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Hash size={20} />
            </div>
          )}
          <div>
            <h2 className="text-white font-medium text-lg">{activeRoom.name}</h2>
            {activeRoom.type !== 'dm' && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users size={12} /> {activeRoom.members?.length || 0} members
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        {loadingMessages && (
          <div className="text-center text-gray-500 text-sm py-4">Loading messages...</div>
        )}
        
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="space-y-6">
            <div className="flex items-center justify-center relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative px-4 bg-[#0f0f11] text-xs font-medium text-gray-500 uppercase tracking-wider">
                {date}
              </div>
            </div>

            {msgs.map((msg: any, index: number) => {
              const isOwn = msg.senderId === user?.id;
              const showAvatar = index === 0 || msgs[index - 1].senderId !== msg.senderId;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={cn("flex gap-4 max-w-[80%]", isOwn ? "ml-auto flex-row-reverse" : "")}
                >
                  {showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0"></div>
                  )}
                  
                  <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-200">{msg.senderName}</span>
                        <span className="text-xs text-gray-500 font-mono">{formatMessageTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed",
                      isOwn ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-[#1c1c22] text-gray-100 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                    {isOwn && activeRoom.type === 'dm' && (
                      <span className="text-[10px] text-gray-500 mt-1">
                        {msg.readBy.length > 1 ? 'Read' : 'Delivered'}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        
        {activeTypingUsers.length > 0 && (
          <div className="flex items-center gap-3 text-gray-500 text-sm italic">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            {activeTypingUsers.map(u => u.username).join(', ')} {activeTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0f0f11] border-t border-white/5">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
            <Paperclip size={20} />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={handleTyping}
              placeholder={`Message ${activeRoom.name}...`}
              className="w-full bg-[#1c1c22] text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
            <button 
              type="button" 
              onClick={() => setShowEmoji(!showEmoji)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Smile size={20} />
            </button>
            
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
}

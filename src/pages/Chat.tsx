import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import RightPanel from '../components/RightPanel';
import { Menu, X } from 'lucide-react';
import { ChatProvider } from '../context/ChatContext';

export default function Chat() {
  const { user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen bg-[#0f0f11] overflow-hidden font-sans text-gray-200">
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden absolute top-4 left-4 z-50 p-2 bg-[#1c1c22] rounded-md text-gray-400"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar */}
        <div className={`
          absolute md:relative z-40 h-full transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex min-w-0">
          <ChatWindow />
        </div>

        {/* Right Panel */}
        <div className="hidden lg:block">
          <RightPanel />
        </div>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </ChatProvider>
  );
}

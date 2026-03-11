import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Clock, Sparkles, Plus, ChevronLeft, ChevronRight, Settings, Image as ImageIcon, BookOpen, ChefHat, Languages, FileText, Code, Trash2, ChevronDown, ChevronUp, User, LogOut, X } from 'lucide-react';
import { FeatureType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewChat: () => void;
  onSelectFeature: (feature: FeatureType, prompt: string) => void;
  chatSessions: Array<{id: string, title: string, date: string}>;
  onDeleteSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, onNewChat, onSelectFeature, chatSessions, onDeleteSession }) => {
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('mazic_current_user');
    if (savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(savedUser);
    }
  }, []);

  const handleAuth = () => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }

    const usersStr = localStorage.getItem('mazic_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (authMode === 'signup') {
      if (users[email]) {
        setAuthError('User already exists. Please sign in.');
        return;
      }
      users[email] = password;
      localStorage.setItem('mazic_users', JSON.stringify(users));
      localStorage.setItem('mazic_current_user', email);
      setCurrentUser(email);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } else {
      if (users[email] && users[email] === password) {
        localStorage.setItem('mazic_current_user', email);
        setCurrentUser(email);
        setIsLoggedIn(true);
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      } else {
        setAuthError('Invalid email or password.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mazic_current_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const featuresList = [
    { type: 'IMAGE' as FeatureType, icon: ImageIcon, label: 'Generate Image', prompt: 'A futuristic city at sunset' },
    { type: 'IMAGE' as FeatureType, icon: ImageIcon, label: 'Ghibli Style', prompt: 'A magical forest in Studio Ghibli style, anime art, vibrant colors' },
    { type: 'STORY' as FeatureType, icon: BookOpen, label: 'Write Story', prompt: 'Write a short story about a time traveler' },
    { type: 'RECIPE' as FeatureType, icon: ChefHat, label: 'Learn Recipe', prompt: 'How do I make authentic carbonara?' },
    { type: 'TRANSLATE' as FeatureType, icon: Languages, label: 'Translate Text', prompt: 'Hello world to Spanish' },
    { type: 'SUMMARY' as FeatureType, icon: FileText, label: 'Write Summary', prompt: 'Summarize the plot of The Matrix' },
    { type: 'CODE' as FeatureType, icon: Code, label: 'Make Code', prompt: 'Write a Python script to scrape a website' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <motion.div 
        initial={false}
        animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
        className={`fixed top-0 left-0 h-full bg-zinc-950 border-r border-white/5 z-50 flex flex-col overflow-hidden transition-all duration-200 ${isOpen ? 'w-[280px]' : 'w-0'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Custom scrollbar hiding via CSS class in index.css, but inline style helps too */}
        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-black" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              MAZIC
            </h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll p-3 space-y-6 flex flex-col">
          
          {/* Chat Option */}
          <div className="space-y-2">
            <button 
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium text-sm">New Chat</span>
            </button>
          </div>

          {/* Features Option */}
          <div className="space-y-2">
            <button 
              onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
              className="w-full flex items-center justify-between px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                <span>Features</span>
              </div>
              {isFeaturesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {isFeaturesExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 gap-1 overflow-hidden"
                >
                  {featuresList.map((feature, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectFeature(feature.type, feature.prompt)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-left group"
                    >
                      <feature.icon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Option (Large Space) */}
          <div className="space-y-2 flex-1 pb-4 flex flex-col">
            <div className="flex items-center gap-2 px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">
              <Clock className="w-3 h-3" />
              <span>History</span>
            </div>
            <div className="space-y-1 flex-1 overflow-y-auto sidebar-scroll">
              {chatSessions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-zinc-500 italic">No history yet</div>
              ) : (
                chatSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between w-full group/item hover:bg-white/5 rounded-lg transition-colors">
                    <button
                      className="flex-1 flex flex-col items-start gap-1 px-3 py-2.5 text-zinc-400 group-hover/item:text-white transition-colors text-left overflow-hidden"
                    >
                      <span className="text-sm font-medium truncate w-full">{session.title}</span>
                      <span className="text-[10px] text-zinc-600">{session.date}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                      className="p-2 text-zinc-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-all rounded-lg hover:bg-white/10 shrink-0 mr-1"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Bottom Settings / Profile */}
        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
          {isLoggedIn ? (
            <div className="flex items-center justify-between px-3 py-2 w-full rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                  {currentUser ? currentUser[0] : 'U'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate w-24">{currentUser?.split('@')[0] || 'User'}</span>
                  <span className="text-[10px] text-zinc-500 truncate w-24">{currentUser || 'user@example.com'}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm"
            >
              <User className="w-4 h-4" />
              Sign In / Sign Up
            </button>
          )}

          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-black" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {authMode === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-zinc-400 text-sm mb-8">
                {authMode === 'login' ? 'Enter your details to access your account.' : 'Sign up to save your generations and history.'}
              </p>
              
              <div className="space-y-4">
                {authError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                    {authError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" 
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    placeholder="••••••••" 
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all" 
                  />
                </div>
                
                <button 
                  onClick={handleAuth}
                  className="w-full bg-white text-black font-bold rounded-xl px-4 py-3.5 hover:bg-zinc-200 transition-colors mt-4"
                >
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
              
              <div className="mt-8 text-center text-sm text-zinc-500">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                  }}
                  className="text-white hover:underline font-medium"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toggle Button (when sidebar is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-6 left-4 z-40 p-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 hover:text-white shadow-lg transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

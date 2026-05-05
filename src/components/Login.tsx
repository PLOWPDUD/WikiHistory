
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserCircle, Globe, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const { login, loginAnonymous } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (type: 'google' | 'anonymous') => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      if (type === 'google') {
        await login();
      } else {
        await loginAnonymous();
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      // Suppress cancelled-popup-request as it's common if user closes window or double clicks
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setIsLoggingIn(false);
        return;
      }
      setError(err.message || 'An unexpected error occurred during login.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-[#a2a9b1] shadow-sm p-8 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#3366cc] flex items-center justify-center rounded-sm">
              <span className="text-white text-3xl font-serif font-bold">W</span>
            </div>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#202122]">Welcome to WikiHistory</h1>
          <p className="text-[#54595d] text-sm italic">
            "The free encyclopedia of every possible history that anyone can edit."
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="google-login-btn"
            disabled={isLoggingIn}
            onClick={() => handleLogin('google')}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#a2a9b1] hover:bg-[#f8f9fa] disabled:opacity-50 text-[#202122] font-medium py-2.5 px-4 transition-colors"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#3366cc]" />
            ) : (
              <LogIn className="w-5 h-5 text-[#3366cc]" />
            )}
            Continue with Google Account
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#eaecf0]"></div>
            <span className="flex-shrink mx-4 text-xs text-[#72777d] uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-[#eaecf0]"></div>
          </div>

          <button
            id="anonymous-login-btn"
            disabled={isLoggingIn}
            onClick={() => handleLogin('anonymous')}
            className="w-full flex items-center justify-center gap-3 bg-[#3366cc] hover:bg-[#2a52a4] disabled:opacity-50 text-white font-medium py-2.5 px-4 transition-colors"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
            Continue as Guest (Anonymous)
          </button>
        </div>

        <div className="pt-6 border-t border-[#eaecf0] grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <Globe className="w-4 h-4 mx-auto text-[#72777d]" />
            <p className="text-[10px] text-[#72777d]">345,123,901 articles in 285 timelines</p>
          </div>
          <div className="space-y-1">
            <UserCircle className="w-4 h-4 mx-auto text-[#72777d]" />
            <p className="text-[10px] text-[#72777d]">Join 14.5 million editors today</p>
          </div>
        </div>
      </motion.div>
      
      <footer className="mt-8 text-xs text-[#72777d] space-x-4">
        <button className="hover:underline">Privacy Policy</button>
        <button className="hover:underline">Terms of Use</button>
        <button className="hover:underline">About WikiHistory</button>
      </footer>
    </div>
  );
};

export default Login;

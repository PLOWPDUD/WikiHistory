
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AccountSettingsProps {
  onBack: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onBack }) => {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateProfile(displayName);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#202122]">Account settings</h1>
          <p className="text-[#54595d] text-sm leading-relaxed">Manage your presence across the multiversal archives.</p>
        </div>
      </div>

      <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#3366cc] rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-sm">
            {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{displayName || 'Guest User'}</h2>
            <p className="text-sm text-[#54595d]">{user?.email || 'Anonymous session'}</p>
          </div>
          <div className="ml-auto">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
              user?.isAnonymous 
                ? "bg-[#fee7e6] border-[#d33] text-[#d33]" 
                : "bg-[#eaf3ff] border-[#36c] text-[#36c]"
            )}>
              {user?.isAnonymous ? 'Guest session' : 'Verified account'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <div className="border-b border-[#a2a9b1] pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-[#54595d]" />
              <h3 className="text-lg font-bold">Public profile</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#202122]">Display name</label>
                <input 
                  id="display-name-input"
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-[#a2a9b1] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3366cc]"
                  placeholder="Enter your multiversal alias"
                />
                <p className="text-xs text-[#54595d]">This name will appear on article histories and your contributions page.</p>
              </div>

              {message && (
                <div className={cn(
                  "p-3 text-sm flex items-center gap-2",
                  message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                )}>
                  {message.text}
                </div>
              )}

              <button
                id="save-profile-btn"
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#3366cc] hover:bg-[#2a52a4] disabled:opacity-50 text-white font-bold py-2 px-6 transition-colors rounded-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            <div className="border-b border-[#a2a9b1] pb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#54595d]" />
              <h3 className="text-lg font-bold">Security</h3>
            </div>
            <div className="bg-[#f8f9fa] border border-[#eaecf0] p-4 text-sm text-[#54595d] italic">
              Multiversal security is currently managed through your primary authentication provider. Password changes for direct logins are pending deployment in timeline-782.
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-[#eaf3ff] border border-[#36c] p-6 rounded-sm space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-[#36c]">
              <ShieldCheck className="w-4 h-4" />
              Archives Guardian
            </h4>
            <p className="text-xs leading-relaxed text-[#54595d]">
              Your account is registered in the <strong>Verified Contributor</strong> tier. You have full permissions to propose edits to non-protected archival documents.
            </p>
            <div className="pt-4 border-t border-[#36c]/20">
              <ul className="text-xs space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#36c] rounded-full"></div>
                  Unlimited multiversal edits
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#36c] rounded-full"></div>
                  Early access to new timelines
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#36c] rounded-full"></div>
                  Priority observer status
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

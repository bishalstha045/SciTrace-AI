import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-theme'));
  
  // Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Initialize from cache to prevent UI flash
  const cachedProfile = JSON.parse(localStorage.getItem('cachedProfile') || 'null');

  // Profile state
  const [profile, setProfile] = useState({
    name: cachedProfile?.name || ' ', // Space prevents 'R' from flashing if we don't have a name yet
    email: cachedProfile?.email || 'Loading...',
    phone: cachedProfile?.phone || '',
    role: cachedProfile?.role || 'Researcher',
    institution: cachedProfile?.institution || '',
    avatarUrl: cachedProfile?.avatarUrl || null
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile(prev => {
          const newProfile = {
            ...prev,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          };
          localStorage.setItem('cachedProfile', JSON.stringify(newProfile));
          return newProfile;
        });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('cachedProfile');
    navigate('/signin');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Simulate API call to save profile
    localStorage.setItem('cachedProfile', JSON.stringify(profile));
    setShowEditModal(false);
    setIsOpen(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) return setPasswordError('Please enter your current password.');
    if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match.');
    if (!profile.email) return setPasswordError('User email not found.');

    try {
      // 1. Verify current password by attempting to re-authenticate
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword
      });

      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      // 2. If successful, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Hide form after 2 seconds
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess('');
      }, 2000);

    } catch (error) {
      setPasswordError(error.message);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-300 transition-colors ml-2 shadow-sm border border-slate-300 overflow-hidden"
      >
        {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
            profile.name.charAt(0)
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
            <p className="text-xs text-slate-500 truncate">{profile.email}</p>
          </div>
          <div className="py-1">
            <button 
              onClick={() => {
                setShowEditModal(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-slate-400" /> Edit Profile
            </button>
            <button 
              onClick={() => {
                setShowSettingsPanel(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-400" /> Settings
            </button>
          </div>
          <div className="py-1 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-red-500" /> Log Out
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Slide-out */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)}></div>
          <div className="w-[400px] h-full bg-white shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 font-serif">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <form id="profile-form" onSubmit={handleSaveProfile} className="p-6 space-y-5">
                <div className="flex justify-center mb-8">
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="avatar-upload"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const updated = {...profile, avatarUrl: reader.result};
                            setProfile(updated);
                            localStorage.setItem('cachedProfile', JSON.stringify(updated));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="avatar-upload" className="block cursor-pointer">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-3xl border-4 border-white shadow-md">
                          {profile.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-white p-2 rounded-full border border-slate-200 shadow-md text-slate-600 hover:text-emerald-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                        <User className="w-4 h-4" />
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name <span className="text-emerald-500">*</span></label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[15px] font-medium text-slate-800 bg-slate-50/50 focus:bg-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address <span className="text-emerald-500">*</span></label>
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[15px] font-medium text-slate-800 bg-slate-50/50 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                  <input 
                    type="tel" 
                    value={profile.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // only allow numbers
                      if (val.length <= 10) setProfile({...profile, phone: val});
                    }}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[15px] font-medium text-slate-800 bg-slate-50/50 focus:bg-white"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Role/Title</label>
                  <input 
                    type="text" 
                    value={profile.role}
                    onChange={(e) => setProfile({...profile, role: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[15px] font-medium text-slate-800 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Institution/Organization</label>
                  <input 
                    type="text" 
                    value={profile.institution}
                    onChange={(e) => setProfile({...profile, institution: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[15px] font-medium text-slate-800 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white mt-auto">
              <button 
                type="submit"
                form="profile-form"
                className="w-full py-3 text-[15px] font-bold text-white bg-[#0f2a24] rounded-xl hover:bg-slate-900 transition-colors shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Slide-out */}
      {showSettingsPanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setShowSettingsPanel(false)}></div>
          <div className="w-[400px] h-full bg-white shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 font-serif">Settings</h3>
              <button onClick={() => setShowSettingsPanel(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div>
                <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Appearance</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-[14px] font-medium text-slate-700">Dark Mode</span>
                    <input type="checkbox" className="toggle toggle-emerald" checked={isDarkMode} onChange={toggleDarkMode} />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Privacy & Data</h4>
                <div className="space-y-3">
                  
                  {!showPasswordForm ? (
                    <button onClick={() => setShowPasswordForm(true)} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-[14px] font-medium text-slate-700">
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                      <h5 className="text-[14px] font-bold text-slate-800 mb-2">Change Password</h5>
                      
                      {passwordError && <div className="text-[13px] text-red-600 bg-red-50 p-2 rounded-lg font-medium">{passwordError}</div>}
                      {passwordSuccess && <div className="text-[13px] text-emerald-600 bg-emerald-50 p-2 rounded-lg font-medium">{passwordSuccess}</div>}
                      
                      <input 
                        type="password" 
                        placeholder="Current Password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[14px] font-medium text-slate-800 bg-white"
                      />
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[14px] font-medium text-slate-800 bg-white"
                      />
                      <input 
                        type="password" 
                        placeholder="Confirm New Password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[14px] font-medium text-slate-800 bg-white"
                      />
                      
                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowPasswordForm(false)} className="flex-1 py-2 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 text-[13px] font-bold text-white bg-[#0f2a24] rounded-lg hover:bg-slate-900 transition-colors">
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  <button className="w-full text-left p-3 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-[14px] font-bold text-red-600">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

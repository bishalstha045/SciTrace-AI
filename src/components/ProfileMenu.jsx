import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, X } from 'lucide-react';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'Bishal Shrestha',
    email: 'bishal@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Researcher',
    institution: 'SciTrace University'
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Simulate API call to save profile
    setShowEditModal(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-300 transition-colors ml-2 shadow-sm border border-slate-300"
      >
        {profile.name.charAt(0)}
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
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-3xl border-4 border-white shadow-md">
                      {profile.name.charAt(0)}
                    </div>
                    <button type="button" className="absolute bottom-1 right-1 bg-white p-2 rounded-full border border-slate-200 shadow-md text-slate-600 hover:text-emerald-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                      <User className="w-4 h-4" />
                    </button>
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
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[15px] font-medium text-slate-800 bg-slate-50/50 focus:bg-white"
                    placeholder="+1 (555) 000-0000"
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
                    <input type="checkbox" className="toggle toggle-emerald" disabled />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-[14px] font-medium text-slate-700">Compact View</span>
                    <input type="checkbox" className="toggle toggle-emerald" />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-[14px] font-medium text-slate-700">Email Alerts</span>
                    <input type="checkbox" className="toggle toggle-emerald" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-[14px] font-medium text-slate-700">Analysis Completion</span>
                    <input type="checkbox" className="toggle toggle-emerald" defaultChecked />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Privacy & Data</h4>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-[14px] font-medium text-slate-700">
                    Export All Data
                  </button>
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

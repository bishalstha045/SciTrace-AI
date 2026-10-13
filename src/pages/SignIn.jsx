import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';

export default function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuestSignIn = () => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('cachedProfile', JSON.stringify({
      name: 'Demo Researcher',
      email: 'researcher@scitrace.ai',
      role: 'Scientific Investigator',
      institution: 'SciTrace AI Research Lab'
    }));
    navigate('/analyses');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/analyses');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'An error occurred during sign in');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-slate-700 font-sans font-medium text-[17px] mb-1">Welcome to</h2>
        <h1 className="text-[2.75rem] font-serif text-[#0f2a24] mb-2 leading-[1.1] tracking-tight">
          SciTrace <span className="text-emerald-500 font-sans font-bold text-[2.5rem]">AI</span>
        </h1>
        <p className="text-slate-500 text-[14px]">Sign in to continue your research journey.</p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[14px] mb-6">
        <button className="flex-1 py-2 text-sm font-semibold bg-white rounded-xl shadow-sm text-slate-900">Sign In</button>
        <Link to="/signup" className="flex-1 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 text-center flex items-center justify-center">Create Account</Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <input type="email" name="email" className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-[15px] transition-colors" placeholder="you@example.com" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <input type={showPassword ? "text" : "password"} name="password" className="block w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-[15px] transition-colors" placeholder="Enter your password" required />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                {showPassword ? <Eye className="h-5 w-5" strokeWidth={1.5} /> : <EyeOff className="h-5 w-5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="rounded text-[#0f2a24] focus:ring-[#0f2a24] border-slate-300 w-4 h-4" defaultChecked />
            <span className="text-[14px] font-medium text-slate-600">Keep me signed in</span>
          </label>
          <Link to="/forgot-password" className="text-[14px] text-blue-600 font-medium hover:underline">Forgot password?</Link>
        </div>

        <button type="submit" disabled={loading} className="group w-full bg-[#0f2a24] text-white rounded-xl py-3.5 font-medium hover:bg-slate-800 transition-all shadow-md mt-6 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50">
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          {!loading && <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">&rarr;</span>}
        </button>
      </form>

      <div className="mt-8 flex items-center">
        <div className="flex-1 border-t border-slate-100"></div>
        <div className="px-4 text-[13px] text-slate-400">Or continue with</div>
        <div className="flex-1 border-t border-slate-100"></div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleGuestSignIn}
          className="w-full bg-emerald-50 border border-emerald-200 rounded-xl py-3 flex items-center justify-center gap-2.5 hover:bg-emerald-100 transition-colors text-[14px] font-bold text-emerald-800 shadow-xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Continue with Demo / Guest Mode
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleOAuthLogin('google')}
          className="w-full border border-slate-200 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors text-[14px] font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Continue with Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleOAuthLogin('github')}
          className="w-full border border-slate-200 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors text-[14px] font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          Continue with GitHub
        </button>
      </div>

      <p className="text-center mt-6 text-[12px] text-slate-400 px-4">
        By continuing, you agree to our <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
      </p>
    </AuthLayout>
  );
}

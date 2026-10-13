import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(() => {
    if (typeof window === 'undefined') return '';
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const queryParams = new URLSearchParams(window.location.search);
    const error = hashParams.get('error_description') || hashParams.get('error') || 
                  queryParams.get('error_description') || queryParams.get('error');
    return error ? decodeURIComponent(error).replace(/\+/g, ' ') : '';
  });

  useEffect(() => {
    if (errorMsg) return;

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setErrorMsg(sessionError.message);
        return;
      }
      
      if (session) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/analyses');
      } else {
        // If there's no session immediately, wait for onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/analyses');
          } else if (event === 'SIGNED_OUT') {
            navigate('/signin');
          }
        });

        const timeout = setTimeout(() => {
           setErrorMsg("Authentication timed out or no session was found. Please check your Supabase configuration.");
        }, 5000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    });
  }, [navigate, errorMsg]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans px-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md w-full border border-red-100 shadow-sm text-center">
          <h2 className="font-bold text-lg mb-2">Authentication Failed</h2>
          <p className="text-sm">{errorMsg}</p>
          <button onClick={() => navigate('/signin')} className="mt-6 bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700">Back to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold text-slate-800">Authenticating...</h2>
      <p className="text-slate-500">Please wait while we complete your sign in.</p>
    </div>
  );
}

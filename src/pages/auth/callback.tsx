import { useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

export default function AuthCallback() {

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // Redirect to login page with error query
          window.location.href = '/login?error=auth-failed';
        } else if (data?.session) {
          // Redirect cleanly to /home, remove ?code and #hash
          window.location.href = '/home';
        } else {
          // No session found
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        window.location.href = '/login?error=callback-exception';
      }
    };

    handleAuthRedirect();
  }, []);

  return <div>Completing authentication...</div>;
}
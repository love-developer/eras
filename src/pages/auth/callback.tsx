import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return <p>Completing login…</p>;
}

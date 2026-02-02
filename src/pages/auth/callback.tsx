import { useEffect } from "react";
import { supabase } from "../../utils/supabase/client";

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Auth callback error:", error);
          // On error, redirect to login
          window.location.replace("/login");
          return;
        }

        if (session) {
          // ✅ Session successfully created, redirect to home
          console.log("✅ Auth session established, redirecting to /home");
          window.location.replace("/home");
        } else {
          // No session found, redirect to login
          console.warn("⚠️ No session found after OAuth callback");
          window.location.replace("/login");
        }
      } catch (error) {
        console.error("❌ Auth callback exception:", error);
        window.location.replace("/login");
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          Signing you in...
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please wait while we complete your authentication
        </p>
      </div>
    </div>
  );
}

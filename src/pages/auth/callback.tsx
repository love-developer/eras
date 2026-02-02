import { useEffect } from "react";
import { supabase } from "../../utils/supabase/client"; // adjust path if needed

export default function AuthCallback() {
  useEffect(() => {
    const handleRedirect = async () => {
      // Grab session from Supabase
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        // Force full URL redirect (remove hash & query params)
        window.location.href = "/home";
      } else {
        console.warn("No session found on callback");
      }
    };

    handleRedirect();
  }, []);

  return <p>Signing you in...</p>;
}

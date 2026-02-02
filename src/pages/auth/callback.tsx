import { useEffect } from "react";
import { supabase } from "../../utils/supabase/client";

export default function AuthCallback() {
  useEffect(() => {
    const handleRedirect = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        // Redirect to /home and remove any query/hash
        window.location.replace("/home");
      } else {
        console.warn("No session found on callback");
      }
    };

    handleRedirect();
  }, []);

  return <p>Signing you in...</p>;
}

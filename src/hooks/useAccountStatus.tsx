import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAccountStatus = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Check current status
    const checkStatus = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (profile?.status === "pending") {
        navigate("/access-pending");
      } else if (profile?.status === "denied") {
        await signOut();
        navigate("/access-denied");
      }
    };

    checkStatus();

    // Set up realtime subscription for status changes
    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new) {
            const newStatus = payload.new.status;
            if (newStatus === "pending") {
              navigate("/access-pending");
            } else if (newStatus === "denied") {
              await signOut();
              navigate("/access-denied");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, signOut]);
};

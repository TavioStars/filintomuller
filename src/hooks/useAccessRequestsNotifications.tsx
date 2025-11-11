import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAccessRequestsNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCount();

    // Set up realtime subscription
    const channel = supabase
      .channel('access-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_requests'
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingCount = async () => {
    const { count, error } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending count:', error);
      setLoading(false);
      return;
    }

    setPendingCount(count || 0);
    setLoading(false);
  };

  return { pendingCount, loading };
};

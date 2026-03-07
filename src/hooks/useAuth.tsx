import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import { useAccountStatus } from "./useAccountStatus";
import { refreshPushSubscription } from "@/lib/pushNotifications";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsAnonymous: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const pushRefreshed = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (event === "SIGNED_IN") {
          setJustLoggedIn(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh push subscription
  useEffect(() => {
    if (!user || pushRefreshed.current) return;
    pushRefreshed.current = true;
    const refreshPush = async () => {
      try {
        const { data } = await supabase.from("profiles").select("push_enabled").eq("id", user.id).single();
        if (data?.push_enabled) {
          await refreshPushSubscription(user.id);
        }
      } catch (err) { console.error("Error refreshing push:", err); }
    };
    setTimeout(refreshPush, 2000);
  }, [user]);

  useEffect(() => { if (!user) pushRefreshed.current = false; }, [user]);

  const clearJustLoggedIn = () => setJustLoggedIn(false);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { name, role } },
    });
    return { error };
  };

  const signOut = async () => {
    if (isAnonymous) { setIsAnonymous(false); }
    else { await supabase.auth.signOut(); }
    setJustLoggedIn(false);
  };

  const continueAsAnonymous = () => { setIsAnonymous(true); setLoading(false); };

  return (
    <AuthContext.Provider value={{ user, session, isAnonymous, justLoggedIn, clearJustLoggedIn, signIn, signUp, signOut, continueAsAnonymous, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const ProtectedRoute = ({ children, allowAnonymous = false }: { children: ReactNode, allowAnonymous?: boolean }) => {
  const { user, isAnonymous, loading } = useAuth();
  const navigate = useNavigate();
  useAccountStatus();

  useEffect(() => {
    if (!loading && !user && !isAnonymous) navigate("/auth");
  }, [user, isAnonymous, loading, navigate]);

  if (loading) return <LoadingScreen />;
  if (!user && !isAnonymous && !allowAnonymous) return null;
  return <>{children}</>;
};

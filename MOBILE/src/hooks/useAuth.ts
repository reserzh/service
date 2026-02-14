import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/api/client";
import type { UserContext, ApiResponse } from "@/types/models";

export function useAuthInit() {
  const { setSession, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserContext().then(setUser).catch(() => setUser(null));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          try {
            const user = await fetchUserContext();
            setUser(user);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setLoading]);
}

async function fetchUserContext(): Promise<UserContext> {
  // The team/me endpoint doesn't exist yet, so we get user info from the Supabase session
  // combined with a settings call to verify API connectivity
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");

  // Try to get the user's profile from the team endpoint
  // For now, construct from available data
  const response = await api.get<ApiResponse<{
    id: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>>(`/team/${user.id}`).catch(() => null);

  if (response?.data) {
    return {
      userId: response.data.id,
      tenantId: response.data.tenantId,
      role: response.data.role as UserContext["role"],
      email: response.data.email,
      firstName: response.data.firstName,
      lastName: response.data.lastName,
    };
  }

  // Fallback: use what we have from Supabase
  return {
    userId: user.id,
    tenantId: "",
    role: "technician",
    email: user.email ?? "",
    firstName: user.user_metadata?.firstName ?? "",
    lastName: user.user_metadata?.lastName ?? "",
  };
}

export function useSignIn() {
  return async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };
}

export function useSignOut() {
  const { signOut } = useAuthStore();

  return async () => {
    await supabase.auth.signOut();
    signOut();
  };
}

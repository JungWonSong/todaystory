"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("auth refetch failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error("auth getUser failed:", error);
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      });

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setLoading(false);
      });

      subscription = authSubscription;
    } catch (error) {
      console.error("auth state listener failed:", error);
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("auth signOut failed:", error);
    }
    setUser(null);
  }, []);

  return {
    user,
    loading,
    signOut,
    refetch,
  };
}

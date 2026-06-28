"use client";

import { useQuery }     from "@tanstack/react-query";
import { useEffect }    from "react";
import { getMeAction }  from "@/lib/actions/users";
import { useAuthStore } from "@/lib/store";

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey:    ["me"],
    queryFn:     getMeAction,
    staleTime:   5 * 60 * 1000, // 5 minutes
    retry:       1,
  });

  // Sync fetched user into Zustand
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
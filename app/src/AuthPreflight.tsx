import { useQuery } from "react-query";
import { apiUrl } from "./utils";

export function AuthPreflight() {
  useQuery(
    "auth-preflight",
    async () => {
      await fetch(apiUrl("/auth-preflight"), {
        method: "POST",
        credentials: "include",
      });
    },
    {
      // Refetch the preflight every 5 minutes to ensure the token + cors is cached
      refetchInterval: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  return null;
}

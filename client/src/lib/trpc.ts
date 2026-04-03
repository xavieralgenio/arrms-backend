import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client"; // ✅ FIX: no batching
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "/api/trpc", // ✅ keep relative (uses same origin)

      transformer: superjson,

      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include", // 🔥 REQUIRED FOR COOKIES
        });
      },
    }),
  ],
});
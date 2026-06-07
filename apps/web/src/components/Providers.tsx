"use client";

import { Provider } from "@/lib/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

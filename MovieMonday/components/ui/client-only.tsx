"use client";

import { useEffect, useState, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * ClientOnly component to prevent hydration errors by only rendering children on the client.
 * Useful for components that use browser APIs or that depend on client state.
 *
 * @param children The component to render only on the client
 * @param fallback Optional fallback to show during SSR and before hydration
 */
export default function ClientOnly({ children, fallback = null }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

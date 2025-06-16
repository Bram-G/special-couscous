"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { ToastProvider } from "@heroui/toast";
import { useEffect, useState } from "react";

export function Providers({
  children,
  themeProps,
}: {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}) {
  // Only show children once mounted to help prevent hydration errors
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <HeroUIProvider>
      <NextThemesProvider {...themeProps}>
        <ToastProvider />
        {mounted ? children : null}
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export default Providers;

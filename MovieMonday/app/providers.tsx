"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import {ToastProvider} from "@heroui/toast";

export function Providers({ children, themeProps }: { children: React.ReactNode; themeProps?: ThemeProviderProps }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider {...themeProps}>
      <ToastProvider />
        {children}
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
export default Providers;
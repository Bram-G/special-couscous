"use client";

import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";

export function Providers({ children, themeProps }: { children: React.ReactNode; themeProps?: ThemeProviderProps }) {
  return (
    <NextUIProvider>
      <NextThemesProvider {...themeProps}>
        {children}
      </NextThemesProvider>
    </NextUIProvider>
  );
}
export default Providers;
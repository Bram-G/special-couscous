"use client";
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import {Link} from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { TwitterIcon, GithubIcon, DiscordIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { MovieSearch } from "@/components/MovieSearch";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

// Logo component that switches based on theme
const ThemeSwitchableLogo = () => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely use the theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine what theme to use for the logo
  const currentTheme = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'dark';
  const logoPath = currentTheme === 'dark' 
    ? "/svgs/logo_full_dark.svg" 
    : "/svgs/logo_full_light.svg";
  
  return (
    <div className="h-8 w-auto flex items-center">
      {mounted ? (
        <Image 
          src={logoPath}
          alt="Movie Monday Logo" 
          width={180} 
          height={40} 
          className="h-full w-auto"
          priority
        />
      ) : (
        // Show a placeholder during SSR/before hydration
        <div className="h-8 w-40 bg-default-100 animate-pulse rounded"></div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to authentication state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep static nav items separate from auth-dependent items
  const staticNavItems = siteConfig.navItems.filter(
    (item) => item.label !== "Sign In" && item.label !== "Dashboard"
  );

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page or login page after logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        {/* Important: NavbarBrand is already a <li> element, so don't wrap it with another list item */}
        <NavbarBrand>
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <ThemeSwitchableLogo />
          </NextLink>
        </NavbarBrand>
        
        {/* Regular nav items */}
        {staticNavItems.map((item) => (
          <NavbarItem key={item.href} className="hidden lg:flex">
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium"
              )}
              color="foreground"
              href={item.href}
            >
              {item.label}
            </NextLink>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden lg:flex">
          <MovieSearch />
        </NavbarItem>
        
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>

        {/* Auth-dependent buttons - only render after client-side hydration */}
        {mounted && (
          <>
            {isAuthenticated && (
              <NavbarItem>
                <Button
                  as={NextLink}
                  className="text-sm font-normal"
                  href="/dashboard"
                  variant="flat"
                >
                  Dashboard
                </Button>
              </NavbarItem>
            )}
            
            <NavbarItem>
              {isAuthenticated ? (
                <Button
                  className="text-sm font-normal"
                  color="danger"
                  variant="flat"
                  onPress={handleLogout}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  as={NextLink}
                  className="text-sm font-normal"
                  href="/login"
                  color="primary"
                  variant="flat"
                >
                  Login
                </Button>
              )}
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <NavbarItem>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
        </NavbarItem>
        
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {staticNavItems.map((item) => (
          <NavbarMenuItem key={item.href}>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active-true]:font-medium"
              )}
              color="foreground"
              href={item.href}
            >
              {item.label}
            </NextLink>
          </NavbarMenuItem>
        ))}
        {mounted && isAuthenticated && (
          <NavbarMenuItem>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active-true]:font-medium"
              )}
              href="/dashboard"
            >
              Dashboard
            </NextLink>
          </NavbarMenuItem>
        )}
        {mounted && (
          <NavbarMenuItem>
            {isAuthenticated ? (
              <Button
                className="text-sm font-normal w-full"
                color="danger"
                variant="flat"
                onPress={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active-true]:font-medium"
                )}
                href="/login"
              >
                Login
              </NextLink>
            )}
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </NextUINavbar>
  );
};

export default Navbar;
"use client";
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button
} from "@heroui/react";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/contexts/AuthContext";
import { MovieSearch } from "@/components/MovieSearch";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChartPieIcon } from "lucide-react";

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
    <div className="h-8 flex items-center">
      {mounted ? (
        <Image 
          src={logoPath}
          alt="Movie Monday Logo" 
          width={150}
          height={30}
          className="h-7 w-auto"
          priority
        />
      ) : (
        // Show a placeholder during SSR/before hydration
        <div className="h-7 w-32 bg-default-100 animate-pulse rounded"></div>
      )}
    </div>
  );
};

// Function to get user initials
const getUserInitials = (username: string | undefined): string => {
  if (!username) return "?";
  
  // For single word usernames, take first two letters
  if (!username.includes(" ")) {
    return username.substring(0, Math.min(username.length, 2)).toUpperCase();
  }
  
  // For multiple words, take first letter of each word
  const nameParts = username.split(" ");
  return (nameParts[0][0] + (nameParts.length > 1 ? nameParts[1][0] : '')).toUpperCase();
};

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to authentication state
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand>
          <NextLink className="flex justify-start items-center" href="/">
            <ThemeSwitchableLogo />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden lg:flex items-center">
          <MovieSearch />
        </NavbarItem>
        
        <NavbarItem className="flex items-center">
          <ThemeSwitch />
        </NavbarItem>

        {/* Auth-dependent buttons - only render after client-side hydration */}
        {mounted && (
          <>
            {isAuthenticated && (
              <>
                <NavbarItem className="flex items-center">
                  <Button
                    as={NextLink}
                    href="/dashboard"
                    isIconOnly
                    variant="light"
                    className="min-w-0 flex items-center justify-center"
                  >
                    <ChartPieIcon className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem className="flex items-center">
                  <Dropdown placement="bottom-end" classNames={{
                    base: "min-w-0",
                    content: "min-w-0 p-0"
                  }}>
                    <DropdownTrigger>
                      <Avatar 
                        as="button" 
                        color="primary"
                        size="sm"
                        name={user?.username ? getUserInitials(user.username) : "U"}
                        className="transition-transform cursor-pointer"
                      />
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="User menu"
                      className="p-0 min-w-0"
                      itemClasses={{
                        base: "px-4 py-2 text-sm",
                      }}
                    >
                      <DropdownItem key="profile" href="/profile">
                        Profile
                      </DropdownItem>
                      <DropdownItem key="watchlists" href="/watchlist">
                        My Watchlists
                      </DropdownItem>
                      <DropdownItem key="analytics" href="/analytics">
                        Analytics
                      </DropdownItem>
                      <DropdownItem key="settings" href="/settings">
                        Settings
                      </DropdownItem>
                      <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                        Logout
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </NavbarItem>
              </>
            )}
            
            {!isAuthenticated && (
              <NavbarItem className="flex items-center">
                <Button
                  as={NextLink}
                  className="text-sm font-normal"
                  href="/login"
                  color="primary"
                  variant="flat"
                >
                  Login
                </Button>
              </NavbarItem>
            )}
          </>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        
        {mounted && isAuthenticated && (
          <NavbarItem>
            <Button
              as={NextLink}
              href="/dashboard"
              isIconOnly
              variant="light"
              className="min-w-0"
            >
              <ChartPieIcon className="h-5 w-5" />
            </Button>
          </NavbarItem>
        )}
        
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu className="pt-2 pb-4 px-2">
        <NavbarMenuItem className="mb-4">
          <MovieSearch />
        </NavbarMenuItem>
        
        {mounted && (
          <>
            {isAuthenticated ? (
              <>
                <NavbarMenuItem className="py-1.5">
                  <NextLink
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active-true]:font-medium text-sm"
                    )}
                    href="/dashboard"
                  >
                    Dashboard
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem className="py-1.5">
                  <NextLink
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active-true]:font-medium text-sm"
                    )}
                    href="/watchlist"
                  >
                    My Watchlists
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem className="py-1.5">
                  <NextLink
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active-true]:font-medium text-sm"
                    )}
                    href="/analytics"
                  >
                    Analytics
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem className="py-1.5">
                  <NextLink
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active-true]:font-medium text-sm"
                    )}
                    href="/settings"
                  >
                    Settings
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem className="py-1.5">
                  <Button
                    className="text-sm font-normal w-full"
                    color="danger"
                    variant="flat"
                    onPress={handleLogout}
                  >
                    Logout
                  </Button>
                </NavbarMenuItem>
              </>
            ) : (
              <>
                <NavbarMenuItem>
                  <NextLink
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active-true]:font-medium"
                    )}
                    href="/"
                  >
                    Home
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <NextLink
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active-true]:font-medium"
                    )}
                    href="/about"
                  >
                    About
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <Button
                    className="text-sm font-normal w-full"
                    color="primary"
                    variant="solid"
                    as={NextLink}
                    href="/login"
                  >
                    Login
                  </Button>
                </NavbarMenuItem>
              </>
            )}
          </>
        )}
      </NavbarMenu>
    </NextUINavbar>
  );
};

export default Navbar;
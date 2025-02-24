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
import { TwitterIcon, GithubIcon, DiscordIcon, Logo } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { MovieSearch } from "@/components/MovieSearch";

export const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

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
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Movie Monday</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {staticNavItems.map((item) => (
            <NavbarItem key={item.href}>
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
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <NavbarItem className="hidden lg:flex">
            <MovieSearch />
          </NavbarItem>
          <ThemeSwitch />
        </NavbarItem>

        {/* Auth-dependent buttons */}
        <NavbarItem className="hidden md:flex gap-2">
          {isAuthenticated && (
            <Button
              as={NextLink}
              className="text-sm font-normal"
              href="/dashboard"
              variant="flat"
            >
              Dashboard
            </Button>
          )}
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
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
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
        {isAuthenticated && (
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
      </NavbarMenu>
    </NextUINavbar>
  );
};

export default Navbar;

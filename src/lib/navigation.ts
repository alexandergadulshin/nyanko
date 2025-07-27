import { ROUTES } from "./constants";
import type { NavItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: ROUTES.HOME,
  },
];

export const USER_MENU_ITEMS: NavItem[] = [
  {
    label: "Profile",
    href: ROUTES.PROFILE,
    requiresAuth: true,
  },
  {
    label: "Settings", 
    href: ROUTES.SETTINGS,
    requiresAuth: true,
  },
];

export const GUEST_MENU_ITEMS: NavItem[] = [
  {
    label: "Sign In",
    href: ROUTES.AUTH,
  },
  {
    label: "Sign Up",
    href: `${ROUTES.AUTH}?tab=signup`,
  },
];


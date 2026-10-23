import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Te opakowania dodają prefiks lokalizacji same, więc komponenty używają
// zwykłych ścieżek ("/cart") i nie muszą wiedzieć o językach.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  BarChart3,
  MessageSquare,
  Layers,
  LayoutDashboard,
  User,
  Package,
  Sprout,
  Cctv,
  Van,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBackOfficeRole } from "@/lib/demo";

export default function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const role = useCurrentRole();
  const isAdmin = isBackOfficeRole(role);

  const userMenuItems = [
    { title: t("nav.overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.profile"), href: "/dashboard/profile", icon: User },
    { title: t("nav.address"), href: "/dashboard/address", icon: Van },
    { title: t("nav.orders"), href: "/dashboard/orders", icon: Package },
  ];

  const adminMenuItems = [
    {
      title: t("nav.analytics"),
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: t("nav.manageVoices"),
      href: "/dashboard/comments",
      icon: MessageSquare,
    },
    { title: t("nav.categories"), href: "/dashboard/categories", icon: Layers },
    { title: t("nav.inventory"), href: "/dashboard/inventory", icon: Package },
    { title: t("nav.ingredients"), href: "/dashboard/ingredients", icon: Sprout },
    { title: t("nav.manageOrders"), href: "/dashboard/manage-orders", icon: Cctv },
  ];

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:gap-6 md:p-6">
      <h2 className="text-lg font-semibold leading-[1.35]">{t("sidebar.title")}</h2>

      {/* Na wąskim ekranie grupy układają się w przewijany poziomo rząd. */}
      <nav
        aria-label={t("sidebar.personal")}
        className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
      >
        {userMenuItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {isAdmin && (
        <nav
          aria-label={t("sidebar.management")}
          className="flex gap-1 overflow-x-auto border-t pt-4 md:flex-col md:overflow-visible md:pt-6"
        >
          {adminMenuItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

// Pomocniczy komponent dla linku, aby nie powtarzać stylów
function SidebarItem({
  item,
  isActive,
}: {
  item: { href: string; title: string; icon: LucideIcon };
  isActive: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  // Na wąskim ekranie aktywny link może leżeć poza przewijanym rzędem.
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [isActive]);

  return (
    <Link
      ref={ref}
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.title}
    </Link>
  );
}

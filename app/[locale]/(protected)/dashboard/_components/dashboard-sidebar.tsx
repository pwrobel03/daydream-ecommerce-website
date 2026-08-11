"use client";

import { useTranslations } from "next-intl";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  BarChart3,
  MessageSquare,
  Layers,
  LayoutDashboard,
  User,
  
  Package,
  ShieldCheck,
  Sprout,
  Cctv,
  Van,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const role = useCurrentRole();
  const isAdmin = role === "ADMIN";

  const userMenuItems = [
    { title: t("nav.overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.profile"), href: "/dashboard/profile", icon: User },
    { title: t("labels.deliveryAddress"), href: "/dashboard/address", icon: Van },
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
    <div className="flex flex-col h-full p-8">
      {/* BRANDING */}
      <div className="mb-12">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          Dashboard
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              isAdmin ? "bg-primary" : "bg-green-500"
            )}
          />
          <p className="text-lg font-black uppercase tracking-[0.3em] opacity-70">
            {isAdmin ? t("nav.adminConsole") : t("labels.userDashboard")}
          </p>
        </div>
      </div>

      {/* USER SECTION */}
      <div className="space-y-1 mb-10">
        <p className="text-lg font-black uppercase tracking-widest opacity-70 mb-4 ml-6">
          Personal
        </p>
        {userMenuItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>

      {/* ADMIN SECTION - RENDEROWANA WARUNKOWO */}
      {isAdmin && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4 ml-6">
            <ShieldCheck size={24} className="text-primary-text" />
            <p className="text-lg font-black uppercase tracking-widest text-primary-text">
              Management
            </p>
          </div>
          {adminMenuItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isAdmin
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Pomocniczy komponent dla linku, aby nie powtarzać stylów
function SidebarItem({
  item,
  isActive,
  isAdmin = false,
}: {
  item: { href: string; title: string; icon: LucideIcon };
  isActive: boolean;
  isAdmin?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500",
        isActive
          ? "bg-primary/60 text-white shadow-xl scale-[1.02]"
          : "hover:bg-primary/20 hover:text-foreground"
      )}
    >
      <item.icon
        className={cn("h-4 w-4", isActive && isAdmin ? "text-primary-text" : "")}
      />
      <span className="font-black italic uppercase tracking-tight text-xs">
        {item.title}
      </span>
    </Link>
  );
}

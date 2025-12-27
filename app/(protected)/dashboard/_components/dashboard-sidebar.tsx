"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  MessageSquare,
  Layers,
  LayoutDashboard,
  User,
  Settings,
  Package,
  ShieldCheck,
  Van,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const role = useCurrentRole();
  const isAdmin = role === "ADMIN";

  const userMenuItems = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Profile", href: "/dashboard/profile", icon: User },
    { title: "Delivery address", href: "/dashboard/address", icon: Van },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
    { title: "Orders", href: "/dashboard/orders", icon: Package },
  ];

  const adminMenuItems = [
    {
      title: "Manage Voices",
      href: "/dashboard/comments",
      icon: MessageSquare,
    },
    { title: "Categories", href: "/dashboard/categories", icon: Layers },
    { title: "Inventory", href: "/dashboard/inventory", icon: Package },
    { title: "Ingredients", href: "/dashboard/ingredients", icon: Package },
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
          <p className="text-lg font-black uppercase tracking-[0.3em] opacity-40">
            {isAdmin ? "Admin Console" : "User Dashboard"}
          </p>
        </div>
      </div>

      {/* USER SECTION */}
      <div className="space-y-1 mb-10">
        <p className="text-lg font-black uppercase tracking-widest opacity-20 mb-4 ml-6">
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
            <ShieldCheck size={24} className="text-primary" />
            <p className="text-lg font-black uppercase tracking-widest text-primary">
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
function SidebarItem({ item, isActive, isAdmin = false }: any) {
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
        className={cn("h-4 w-4", isActive && isAdmin ? "text-primary" : "")}
      />
      <span className="font-black italic uppercase tracking-tight text-xs">
        {item.title}
      </span>
    </Link>
  );
}

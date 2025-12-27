"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUser } from "react-icons/fa";
import { LogOut, Settings, UserRoundPen, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "./logout-button";
import Link from "next/link";

export const UserButton = () => {
  const user = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex flex-row cursor-pointer text-white bg-input/60 rounded-full p-1 justify-center items-center sm:px-4">
        <Avatar className="w-6 h-6">
          <AvatarImage src={user?.image || ""} alt="User Avatar" />
          <AvatarFallback className="bg-transparent">
            {/* User initials or fallback icon */}
            <User />
          </AvatarFallback>
        </Avatar>
        <span className="ml-4 hidden sm:flex text-xs uppercase font-black">
          profile
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem>
          <Link href={"/settings"} className="flex">
            <UserRoundPen className="w-4 h-4 mr-1" />
            <p>Profile</p>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={"/dashboard"} className="flex">
            <Settings className="w-4 h-4 mr-1" />
            <p>Dashboard</p>
          </Link>
        </DropdownMenuItem>
        <LogoutButton>
          <DropdownMenuItem>
            <LogOut className="w-4 h-4 mr-1" />
            <p>Log out</p>
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

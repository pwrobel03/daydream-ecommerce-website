"use client";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onClick = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    // 👇 Zmiana span na div
    <div onClick={onClick} className="cursor-pointer">
      {children}
    </div>
  );
};

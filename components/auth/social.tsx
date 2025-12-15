"use client";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

export const Social = () => {
  const onClick = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/auth/login" });
  };
  return (
    <div className="flex items-center gap-x-2 w-full">
      <Button
        className="flex-1"
        size="lg"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>
      <Button
        className="flex-1"
        size="lg"
        variant="outline"
        onClick={() => onClick("github")}
      >
        <FaGithub className="h-5 w-5" />
      </Button>
    </div>
  );
};

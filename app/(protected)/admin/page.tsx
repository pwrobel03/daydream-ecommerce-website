"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RoleGate from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { admin } from "@/actions/admin";

const AdminPage = () => {
  const roleFromHook = useCurrentRole();
  const [role, setRole] = useState<UserRole | null>(null);
  const onApiRouteClick = () => {
    fetch("/api/admin").then((response) => {
      if (response.ok) return toast.success("Allowed API Route");
      return toast.error("Forbidden API Route!");
    });
  };

  const onServerActionClick = () => {
    admin().then((data) => {
      if (data.error) {
        return toast.error(data.error);
      }

      if (data.success) {
        return toast.success(data.success);
      }
    });
  };

  useEffect(() => {
    setRole(roleFromHook);
  }, [roleFromHook]);

  return (
    <Card className="w-150">
      <CardHeader>
        <CardTitle>Admin Page</CardTitle>
      </CardHeader>
      <CardContent>
        <RoleGate allowedRole={UserRole.ADMIN}>
          <p className="text-emerald-600 font-bold py-3">
            Welcome, Admin! You have access to this page.
          </p>
        </RoleGate>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
          <p className="text-sm font-medium">Admin-only API Route</p>
          <Button onClick={onApiRouteClick}>Click to test</Button>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
          <p className="text-sm font-medium">Admin-only server action</p>
          <Button onClick={onServerActionClick}>Click to test</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPage;

"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";
import { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AdminPage = () => {
  const roleFromHook = useCurrentRole();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(roleFromHook);
  }, [roleFromHook]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Page</CardTitle>
      </CardHeader>
      <CardContent>
        {role === UserRole.ADMIN ? (
          <p>Welcome, Admin! You have access to this page.</p>
        ) : (
          <p className="text-red-500">
            Access Denied. You do not have permission to view this page.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPage;

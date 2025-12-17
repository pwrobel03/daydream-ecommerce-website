import { ExtendedUser } from "@/next-auth";
import { Card, CardContent, CardHeader } from "./ui/card";

interface userInfoProps {
  user?: ExtendedUser;
  label: string;
}

export const UserInfo = ({ user, label }: userInfoProps) => {
  return (
    <Card>
      <CardHeader className="font-medium">{label}</CardHeader>
      <CardContent className="w-150">
        <div className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm">
          <p className="text-sm font-medium">ID</p>
          <p className="text-xs font-mono-1 p-1 rounded-md truncate">
            {user?.id}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm">
          <p className="text-sm font-medium">Name</p>
          <p className="text-xs font-mono-1 p-1 rounded-md truncate">
            {user?.name}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm">
          <p className="text-sm font-medium">Email</p>
          <p className="text-xs font-mono-1 p-1 rounded-md truncate">
            {user?.email}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm">
          <p className="text-sm font-medium">Role</p>
          <p className="text-xs font-mono-1 p-1 rounded-md truncate">
            {user?.role}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

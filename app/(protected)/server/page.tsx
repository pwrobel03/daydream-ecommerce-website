import { getCurrentUser } from "@/lib/auth";
import { UserInfo } from "@/components/user-info";
const ServerPage = async () => {
  const user = (await getCurrentUser()) || undefined;

  return <UserInfo user={user} label="Server Component User Info" />;
};

export default ServerPage;

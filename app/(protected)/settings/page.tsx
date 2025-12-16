"use client";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCurrentUser } from "@/hooks/use-current-user";

// TODO: now it working weird, need to fix taht
// on redirect user data didn;t show imediately after login
// uoy need to reload th show user data
const SettingsPage = () => {
  const user = useCurrentUser();
  return (
    <div className="bg-stone-700 text-white p-10 rounded-xl shadow-md w-150 mx-auto">
      <p className="text-center mb-4 font-bold">Settings</p>

      {/* show user data */}
      <pre className="p-4 bgrounded-md mb-4 overflow-auto">
        {JSON.stringify(user, null, 2)}
      </pre>

      <div className="flex justify-center">
        <LogoutButton>
          <button className=" text-white bg-sky-600 px-4 py-2 rounded-md">
            Log out
          </button>
        </LogoutButton>
      </div>
    </div>
  );
};

export default SettingsPage;

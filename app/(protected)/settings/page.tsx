import { auth, signOut } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";

const SettingsPage = async () => {
  const session = await auth();
  return (
    <div className="bg-white p-10 rounded-xl shadow-md w-150 mx-auto mt-20">
      <p className="text-center mb-4 font-bold">Settings</p>

      {/* Wyświetlanie sesji dla testów */}
      <pre className="bg-gray-100 p-4 rounded-md mb-4 overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>

      <div className="flex justify-center">
        {/* 👇 Używamy naszego Client Componentu */}
        <LogoutButton>
          <button className="bg-black text-white px-4 py-2 rounded-md">
            Log out
          </button>
        </LogoutButton>
      </div>
    </div>
  );
};

export default SettingsPage;

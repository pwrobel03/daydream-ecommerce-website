import { Navbar } from "./settings/_components/navbar";
interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  return (
    <div className="w-full h-full flex flex-col gap-y-10 items-center">
      <Navbar />
      {children}
    </div>
  );
};
export default ProtectedLayout;

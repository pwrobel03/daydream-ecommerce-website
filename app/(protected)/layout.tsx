import { Navbar } from "./_components/navbar";
interface ProtectedLayoutProps {
  children: React.ReactNode;
}
import Container from "@/components/Container";

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  return <>{children}</>;
  // <Container className="w-full h-full flex flex-row gap-y-10 items-center">
  //   <Navbar />
  //   {children}
  // </Container>
};
export default ProtectedLayout;

import Container from "@/components/Container";
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container className="mt-20 flex items-center justify-center">
      {children}
    </Container>
  );
};

export default AuthLayout;

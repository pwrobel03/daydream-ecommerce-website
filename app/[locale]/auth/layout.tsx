import Container from "@/components/Container";
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container className="my-20 flex items-center justify-center">
      {children}
    </Container>
  );
};

export default AuthLayout;

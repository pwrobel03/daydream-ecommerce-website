import Container from "@/components/Container";
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container className="my-12 flex items-center justify-center md:my-20">
      {children}
    </Container>
  );
};

export default AuthLayout;

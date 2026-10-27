import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Header } from "./header";

interface CardWrapperProps {
  children?: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
}

export const CardWrapper = ({ children, title, description, footer }: CardWrapperProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Header title={title} description={description} />
      </CardHeader>
      {children && <CardContent className="space-y-6">{children}</CardContent>}
      {footer && <CardFooter className="flex-col items-start gap-3 text-sm">{footer}</CardFooter>}
    </Card>
  );
};

import { Header } from "./header";
import { BackButton } from "./back-button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

interface ErrorCardProps {}

export const ErrorCard = ({}: ErrorCardProps) => {
  return (
    <Card className="w-100 shadow-md">
      <CardHeader>
        <Header label="Authentication Error" />
      </CardHeader>
      <CardContent>
        <p className="text-center text-red-600">
          There was an error during authentication. Please try again.
        </p>
      </CardContent>
      <CardFooter>
        <BackButton label="Go back to Login" href="/auth/login" />
      </CardFooter>
    </Card>
  );
};

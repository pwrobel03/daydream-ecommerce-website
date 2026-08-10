import { Button, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./layout";

export function VerifyEmail({ url }: { url: string }) {
  return (
    <EmailLayout
      preview="Confirm your email to finish signing up"
      heading="Confirm your email"
    >
      <Text style={emailStyles.text}>
        Thanks for signing up. Confirm this address to activate your account.
      </Text>
      <Button
        href={url}
        style={{
          backgroundColor: "#1a1a1a",
          color: "#ffffff",
          padding: "14px 28px",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          textDecoration: "none",
        }}
      >
        Confirm email
      </Button>
      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        The link expires in 30 minutes. If you did not sign up, ignore this message.
      </Text>
    </EmailLayout>
  );
}

export default VerifyEmail;

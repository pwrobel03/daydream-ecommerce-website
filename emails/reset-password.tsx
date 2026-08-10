import { Button, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./layout";

export function ResetPassword({ url }: { url: string }) {
  return (
    <EmailLayout preview="Reset your Daydream password" heading="Reset your password">
      <Text style={emailStyles.text}>
        Someone asked to reset the password for this account. If it was you, use
        the button below.
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
        Set a new password
      </Button>
      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        The link expires in 30 minutes. If it was not you, no action is needed —
        the password stays unchanged.
      </Text>
    </EmailLayout>
  );
}

export default ResetPassword;

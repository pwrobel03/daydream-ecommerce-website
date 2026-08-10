import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

// Style inline i układ tabelkowy generuje React Email — Outlook renderuje
// maile silnikiem Worda, więc flexbox i grid nie wchodzą w grę.
const styles = {
  body: { backgroundColor: "#faf7f2", fontFamily: "Helvetica, Arial, sans-serif" },
  container: { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" },
  brand: {
    fontSize: "32px",
    fontWeight: 900 as const,
    fontStyle: "italic" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "-1px",
    margin: "0 0 32px",
    color: "#1a1a1a",
  },
  heading: { fontSize: "22px", fontWeight: 700 as const, margin: "0 0 16px", color: "#1a1a1a" },
  text: { fontSize: "15px", lineHeight: "24px", color: "#3a3a3a", margin: "0 0 16px" },
  hr: { borderColor: "#e8e2d9", margin: "32px 0" },
  footer: { fontSize: "12px", color: "#8a8a8a", margin: 0 },
};

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      {/* Tekst widoczny na liście wiadomości, zanim odbiorca otworzy maila. */}
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Daydream</Text>
          <Heading style={styles.heading}>{heading}</Heading>
          <Section>{children}</Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            Daydream — handcrafted granola &amp; breakfast bars.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export { styles as emailStyles };

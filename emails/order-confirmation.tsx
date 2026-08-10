import { Column, Hr, Row, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./layout";

export interface OrderConfirmationProps {
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  address: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
  } | null;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const cell = { fontSize: "14px", color: "#3a3a3a", padding: "6px 0" };
const right = { ...cell, textAlign: "right" as const };

export function OrderConfirmation({
  orderId,
  items,
  subtotal,
  discount,
  total,
  address,
}: OrderConfirmationProps) {
  return (
    <EmailLayout
      preview={`Order ${orderId} confirmed — ${money(total)}`}
      heading="Your order is confirmed"
    >
      <Text style={emailStyles.text}>
        Thanks for your order. We are packing it now.
      </Text>

      <Section>
        {items.map((item, index) => (
          <Row key={index}>
            <Column style={cell}>
              {item.name} × {item.quantity}
            </Column>
            <Column style={right}>{money(item.price * item.quantity)}</Column>
          </Row>
        ))}
      </Section>

      <Hr style={emailStyles.hr} />

      <Section>
        <Row>
          <Column style={cell}>Subtotal</Column>
          <Column style={right}>{money(subtotal)}</Column>
        </Row>
        {discount > 0 && (
          <Row>
            <Column style={cell}>Discount</Column>
            <Column style={right}>−{money(discount)}</Column>
          </Row>
        )}
        <Row>
          <Column style={{ ...cell, fontWeight: 700 }}>Total</Column>
          <Column style={{ ...right, fontWeight: 700 }}>{money(total)}</Column>
        </Row>
      </Section>

      {address && (
        <>
          <Hr style={emailStyles.hr} />
          <Text style={{ ...emailStyles.text, marginBottom: "4px", fontWeight: 700 }}>
            Shipping to
          </Text>
          <Text style={{ ...emailStyles.text, margin: 0 }}>
            {address.fullName}
            <br />
            {address.street}
            <br />
            {address.zipCode} {address.city}
          </Text>
        </>
      )}

      <Hr style={emailStyles.hr} />
      <Text style={{ ...emailStyles.footer }}>Order reference: {orderId}</Text>
    </EmailLayout>
  );
}

export default OrderConfirmation;

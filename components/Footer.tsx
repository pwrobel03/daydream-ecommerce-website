import React from "react";
import Container from "./Container";
import Image from "next/image";
import payment from "@/assets/payment.png";

const Footer = () => {
  return (
    <footer className="bg-card">
      <Container className="py-10 flex md:flex-row flex-col justify-between items-center gap-10">
        <p className="text-chart-3">
          Copyright @ 2025 <span>reactBD</span> all right reserved.
        </p>
        <Image src={payment} alt="payment method" />
      </Container>
    </footer>
  );
};

export default Footer;

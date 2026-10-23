"use client";

import { useFormatter } from "next-intl";
import { twMerge } from "tailwind-merge";

interface Props {
  amount: number;
  className?: string;
}

/**
 * Kwota sformatowana według aktywnego języka trasy.
 *
 * Wcześniej locale było zaszyte jako "en-US", więc polska wersja sklepu
 * pokazywała amerykańskie separatory i pozycję symbolu. Waluta zostaje USD —
 * to jedna waluta rozliczeniowa, ta sama, którą dostaje Stripe — zmienia się
 * tylko sposób jej zapisu.
 */
const PriceFormatter = ({ amount, className }: Props) => {
  const format = useFormatter();

  return (
    <span className={twMerge("font-semibold text-darkText flex", className)}>
      {format.number(amount, { style: "currency", currency: "USD" })}
    </span>
  );
};

export default PriceFormatter;

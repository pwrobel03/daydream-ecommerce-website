import { twMerge } from "tailwind-merge";
import PriceFormatter from "../PriceFormatter";

interface PriceViewProps {
  price: number | undefined;
  discount: number | undefined;
  className?: string;
  label?: string;
}
const PriceView = ({ price, discount, label, className }: PriceViewProps) => {
  if (!price) return null;
  return (
    <div className="flex items-center justify-between gap-5">
      <div className="flex items-center gap-2">
        {price && !discount && (
          <PriceFormatter amount={price} className={className} />
        )}
        {price && discount && (
          <div className="flex flex-row justify-center items-center gap-2">
            <PriceFormatter
              amount={price}
              className={twMerge("line-through text-xs font-medium", className)}
            />
            <PriceFormatter amount={discount} className={className} />
          </div>
        )}
      </div>
      <p className="text-gray-500">{label}</p>
    </div>
  );
};

export default PriceView;

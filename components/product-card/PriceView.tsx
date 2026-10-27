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
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
      {discount ? (
        <>
          <PriceFormatter amount={discount} className={className} />
          <PriceFormatter
            amount={price}
            className="text-sm font-normal text-muted-foreground line-through"
          />
        </>
      ) : (
        <PriceFormatter amount={price} className={className} />
      )}
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};

export default PriceView;

import { Badge } from "@/components/ui/badge";

interface ProductProps {
  name: string;
  // Kept so callers stay unchanged; the stored colour cannot guarantee 4.5:1 text (ADR 0016).
  color?: string;
  className?: string;
}

const ProductStatusBadge = ({ name, className }: ProductProps) => {
  if (!name) return null;
  return (
    <Badge variant="secondary" className={className}>
      {name}
    </Badge>
  );
};

export default ProductStatusBadge;

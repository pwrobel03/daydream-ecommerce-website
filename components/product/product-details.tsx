"use client";

import { ProductType } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import PriceFormatter from "../product-card/PriceFormatter";

export default function ProductDetails({ product }: { product: ProductType }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.promoPrice
    ? Math.round((1 - product.promoPrice / product.price) * 100)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Badge Statusu */}
      {product.status && (
        <span
          style={{ backgroundColor: product.status.color || "#000" }}
          className="w-fit text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
        >
          {product.status.name}
        </span>
      )}

      <h1 className="text-4xl font-bold">{product.name}</h1>

      {/* Ceny */}
      <div className="flex items-center gap-4">
        {product.promoPrice ? (
          <>
            <span className="text-3xl font-black text-primary">
              <PriceFormatter amount={product.promoPrice} />
            </span>
            <span className="text-xl text-muted-foreground line-through">
              <PriceFormatter amount={product.price} />
            </span>
            <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-md text-sm font-bold">
              -{discount}%
            </span>
          </>
        ) : (
          <span className="text-3xl font-black">
            <PriceFormatter amount={product.price} />
          </span>
        )}
      </div>

      <p className="text-muted-foreground leading-relaxed">
        {product.description}
      </p>

      {/* Akcja dodania do koszyka */}
      <div className="flex gap-4 mt-4">
        <Button
          size="lg"
          className="flex-1 rounded-full h-14 text-lg font-bold"
          onClick={handleAddToCart}
        >
          {added ? (
            <Check className="mr-2" />
          ) : (
            <ShoppingCart className="mr-2" />
          )}
          {added ? "Dodano!" : "Dodaj do koszyka"}
        </Button>
      </div>

      {/* Składniki w pigułkach */}
      <div className="pt-6 border-t">
        <h3 className="font-semibold mb-3">Składniki:</h3>
        <div className="flex flex-wrap gap-2">
          {product.ingredients.map((ing) => (
            <span
              key={ing.id}
              className="bg-foreground text-background px-3 py-1 rounded-full text-sm"
            >
              {ing.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

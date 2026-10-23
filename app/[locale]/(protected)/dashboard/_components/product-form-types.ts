// Typy współdzielone przez sekcje formularza produktu.
import type { UseFormReturn } from "react-hook-form";
import type * as z from "zod";
import type { productSchema } from "@/schemas";

// Schemat używa z.coerce dla `stock`, więc typ wejściowy (to, co trzymają pola
// formularza) różni się od wyjściowego (to, co zwraca walidacja). Rozróżnienie
// obu jest tym, czego brakowało — bez niego generyki react-hook-form się nie
// domykały i każde użycie `control` wymagało `as any`.
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;

export type ProductForm = UseFormReturn<
  ProductFormInput,
  unknown,
  ProductFormValues
>;

export interface ProductSectionProps {
  form: ProductForm;
  loading: boolean;
}

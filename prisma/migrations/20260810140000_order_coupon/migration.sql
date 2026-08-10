-- Kupon użyty przy zamówieniu. discountAmount jest snapshotem: Sale.discountValue
-- może się później zmienić, a zamówienie musi pamiętać, ile faktycznie odjęto.
ALTER TABLE "Order" ADD COLUMN "saleId" TEXT;
ALTER TABLE "Order" ADD COLUMN "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_saleId_idx" ON "Order"("saleId");

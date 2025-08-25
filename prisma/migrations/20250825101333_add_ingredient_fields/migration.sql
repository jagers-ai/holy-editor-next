-- AlterTable
ALTER TABLE "public"."ingredients" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "quantity" DECIMAL(10,2),
ADD COLUMN     "subcategory" TEXT;

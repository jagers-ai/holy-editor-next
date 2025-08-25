-- AlterTable
ALTER TABLE "public"."recipes" ADD COLUMN     "baker" TEXT,
ADD COLUMN     "fermentationInfo" TEXT,
ADD COLUMN     "moldSize" TEXT,
ADD COLUMN     "ovenTemp" INTEGER,
ADD COLUMN     "ovenTime" INTEGER;

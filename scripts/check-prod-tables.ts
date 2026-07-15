import "dotenv/config";
import prisma from "@/lib/db/prisma";

async function checkTables() {
  console.log("Checking production tables...");
  try {
    const photoBundles = await prisma.photoBundle.count();
    console.log(`✓ PhotoBundle table exists. Records: ${photoBundles}`);

    const bundlePhotos = await prisma.bundlePhoto.count();
    console.log(`✓ BundlePhoto table exists. Records: ${bundlePhotos}`);

    console.log("\n✓ Migration applied successfully!");
  } catch (err: any) {
    console.error("✗ Table check failed:", err.message);
    if (err.message.includes("does not exist")) {
      console.log("\nMigration NOT applied. Tables missing.");
      process.exit(1);
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

checkTables().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

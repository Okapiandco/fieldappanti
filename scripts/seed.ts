import { mockDb } from "../src/lib/db/mockDb";

console.log("🌱 Triggering Local Database Seeding...");
try {
  mockDb.seed(true);
  console.log("🎉 Seeding completed successfully!");
} catch (err) {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
}

import { drizzle } from "drizzle-orm/mysql2";
import { packages } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const samplePackages = [
  {
    name: "Day Tour Package",
    description: "Perfect for a day of relaxation and fun. Includes pool access, lunch, and activities.",
    type: "day_tour",
    basePrice: "1500",
    maxCapacity: 50,
    duration: "8 hours (9 AM - 5 PM)",
    amenities: JSON.stringify([
      "Pool access",
      "Lunch buffet",
      "Water activities",
      "Complimentary drinks",
      "Beach access",
    ]),
  },
  {
    name: "Romantic Overnight Stay",
    description: "A perfect romantic getaway with premium room, dinner, and breakfast.",
    type: "overnight",
    basePrice: "4500",
    maxCapacity: 2,
    duration: "1 night",
    amenities: JSON.stringify([
      "Deluxe room with ocean view",
      "Romantic dinner",
      "Breakfast buffet",
      "Spa access",
      "Late checkout",
    ]),
  },
  {
    name: "Family Weekend Package",
    description: "Create lasting memories with your family. Includes accommodation, meals, and activities.",
    type: "overnight",
    basePrice: "8000",
    maxCapacity: 6,
    duration: "2 nights",
    amenities: JSON.stringify([
      "2 family rooms",
      "All meals included",
      "Kids activities",
      "Pool and beach access",
      "Game room access",
    ]),
  },
  {
    name: "Corporate Event Package",
    description: "Host your corporate events, conferences, and team building activities.",
    type: "event",
    basePrice: "25000",
    maxCapacity: 200,
    duration: "Full day or customizable",
    amenities: JSON.stringify([
      "Event venue",
      "Catering service",
      "AV equipment",
      "WiFi and tech support",
      "Accommodation available",
    ]),
  },
  {
    name: "Wedding Package",
    description: "Make your special day unforgettable with our comprehensive wedding package.",
    type: "event",
    basePrice: "50000",
    maxCapacity: 300,
    duration: "Customizable",
    amenities: JSON.stringify([
      "Venue decoration",
      "Catering (100+ guests)",
      "Photography service",
      "Sound and lighting",
      "Accommodation for guests",
    ]),
  },
];

async function seed() {
  try {
    console.log("🌱 Seeding database...");
    
    for (const pkg of samplePackages) {
      await db.insert(packages).values(pkg);
      console.log(`✅ Added package: ${pkg.name}`);
    }
    
    console.log("✨ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();

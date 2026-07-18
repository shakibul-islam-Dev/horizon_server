import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/Category";

dotenv.config();

const categories = [
  { name: "Electronics", description: "Gadgets, devices, and tech accessories", icon: "📱" },
  { name: "Fashion", description: "Clothing, shoes, and accessories", icon: "👔" },
  { name: "Home & Garden", description: "Furniture, decor, and garden supplies", icon: "🏠" },
  { name: "Sports & Outdoors", description: "Fitness equipment and outdoor gear", icon: "⚽" },
  { name: "Books & Media", description: "Books, movies, music, and games", icon: "📚" },
  { name: "Toys & Games", description: "Children toys and board games", icon: "🎮" },
  { name: "Health & Beauty", description: "Personal care and wellness products", icon: "💊" },
  { name: "Automotive", description: "Car parts, accessories, and tools", icon: "🚗" },
  { name: "Food & Beverages", description: "Gourmet food and drinks", icon: "🍕" },
  { name: "Art & Crafts", description: "Art supplies and handmade items", icon: "🎨" },
  { name: "Real Estate", description: "Properties and rentals", icon: "🏘️" },
  { name: "Services", description: "Professional services and consulting", icon: "💼" },
  { name: "Education", description: "Courses, tutoring, and learning materials", icon: "🎓" },
  { name: "Pets", description: "Pet supplies and accessories", icon: "🐾" },
  { name: "Music & Instruments", description: "Musical instruments and gear", icon: "🎵" },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_DB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_DB_URI is required");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await Category.deleteMany({});
    console.log("Cleared existing categories");

    const created = await Category.insertMany(categories);
    console.log(`Seeded ${created.length} categories`);

    console.log("\nSeeded categories:");
    created.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    await mongoose.disconnect();
    console.log("\nDatabase seeded successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDB();

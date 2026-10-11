const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

// Load environment variables from the .env file in the parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ==================== CATEGORIES DATA ====================
// Complete list of all product categories and subcategories for One Stop Shop
const categoriesData = [
  // ================= PHONES / TABLETS & iPAD =================
  {
    name: 'Phones / Tablets & iPad',
    slug: 'phones-tablets-ipad',
    displayOrder: 1,
    subcategories: [
      { name: 'iPhones', slug: 'iphones' },
      { name: 'Redmi', slug: 'redmi' },
      { name: 'Samsung S Series', slug: 'samsung-s-series' },
      { name: 'Samsung A Series', slug: 'samsung-a-series' },
      { name: 'Samsung Tablet', slug: 'samsung-tablet' },
      { name: 'Kids Tablet', slug: 'kids-tablet' },
      { name: 'iPads', slug: 'ipads' },
    ],
  },

  // ================= CABLES & PLUGS =================
  { name: 'Cables & Plugs', slug: 'cables-plugs', displayOrder: 2 },

  // ================= CAR ACCESSORIES =================
  { name: 'Car Accessories', slug: 'car-accessories', displayOrder: 3 },

  // ================= POWER BANK =================
  { name: 'Power Bank', slug: 'power-bank', displayOrder: 4 },

  // ================= RADIO / CD PLAYER =================
  { name: 'Radio / CD Player', slug: 'radio-cd-player', displayOrder: 5 },

  // ================= EARBUDS =================
  { name: 'Earbuds', slug: 'earbuds', displayOrder: 6 },

  // ================= GADGETS =================
  { name: 'Gadgets', slug: 'gadgets', displayOrder: 7 },

  // ================= TOYS =================
  { name: 'Toys', slug: 'toys', displayOrder: 8 },

  // ================= NEW ARRIVALS =================
  {
    name: 'New Arrivals',
    slug: 'new-arrivals',
    displayOrder: 9,
    subcategories: [
      { name: 'New Arrivals (Case/Covers)', slug: 'new-arrivals-case-covers' },
      { name: 'New Arrivals (Container Items)', slug: 'new-arrivals-container-items' },
    ],
  },

  // ================= RING LIGHT =================
  { name: 'Ring Light', slug: 'ring-light', displayOrder: 10 },

  // ================= DRONE =================
  { name: 'Drone', slug: 'drone', displayOrder: 11 },

  // ================= SMART WATCH =================
  { name: 'Smart Watch', slug: 'smart-watch', displayOrder: 12 },

  // ================= BLUETOOTH SPEAKER =================
  { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', displayOrder: 13 },

  // ================= EARPHONE / HEADSET =================
  { name: 'Earphone / Headset', slug: 'earphone-headset', displayOrder: 14 },

  // ================= SECURITY CAMERAS =================
  { name: 'Security Cameras', slug: 'security-cameras', displayOrder: 15 },

  // ================= SELFIE STICK / PHONE STAND =================
  { name: 'Selfie Stick / Phone Stand', slug: 'selfie-stick-phone-stand', displayOrder: 16 },

  // ================= PC & LAPTOP ACCESSORIES =================
  { name: 'PC & Laptop Accessories', slug: 'pc-laptop-accessories', displayOrder: 17 },

  // ================= CASES AND COVERS =================
  {
    name: 'Cases And Covers',
    slug: 'cases-and-covers',
    displayOrder: 18,
    subcategories: [
      { name: 'iPhone Cases', slug: 'iphone-cases' },
      { name: 'Samsung Cases', slug: 'samsung-cases' },
      { name: 'Redmi Cases', slug: 'redmi-cases' },
      { name: 'Tablet Cases', slug: 'tablet-cases' },
      { name: 'iPad Cases', slug: 'ipad-cases' },
      { name: 'Belt Cases', slug: 'belt-cases' },
      { name: 'AirPod Cases / Air Tags', slug: 'airpod-cases-air-tags' },
    ],
  },

  // ================= GAMING =================
  {
    name: 'Gaming',
    slug: 'gaming',
    displayOrder: 19,
    subcategories: [
      { name: 'PlayStation Console', slug: 'playstation-console' },
      { name: 'PlayStation Accessories', slug: 'playstation-accessories' },
      { name: 'Xbox Accessories', slug: 'xbox-accessories' },
      { name: 'Nintendo Switch', slug: 'nintendo-switch' },
      { name: 'Nintendo Switch Accessories', slug: 'nintendo-switch-accessories' },
      { name: 'Gaming Headphones', slug: 'gaming-headphones' },
      { name: 'Gaming Accessories', slug: 'gaming-accessories' },
    ],
  },

  // ================= BEAUTY & CARE =================
  { name: 'Beauty & Care', slug: 'beauty-and-care', displayOrder: 20 },

  // ================= WIFI EXTENDER & ROUTER =================
  { name: 'WiFi Extender & Router', slug: 'wifi-extender-router', displayOrder: 21 },

  // ================= LIGHTS =================
  { name: 'Lights', slug: 'lights', displayOrder: 22 },
];

// ==================== SEEDING FUNCTION ====================
// Main function to populate the database with categories and subcategories
const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Delete all existing categories for a fresh start
    await Category.deleteMany({});
    console.log('🗑️  Old categories removed');

    let parentCount = 0;
    let subCount = 0;

    // Loop through each category and insert into database
    for (const cat of categoriesData) {
      // Create parent category
      const parent = await Category.create({
        name: cat.name,
        slug: cat.slug,
        description: `${cat.name} - One Stop Shop Ireland`,
        displayOrder: cat.displayOrder,
        parentCategory: null, // null means it's a top-level category
      });
      parentCount++;

      // Create subcategories (if any exist for this category)
      if (cat.subcategories && cat.subcategories.length > 0) {
        for (const sub of cat.subcategories) {
          await Category.create({
            name: sub.name,
            slug: sub.slug,
            description: `${sub.name} - One Stop Shop Ireland`,
            parentCategory: parent._id, // Link to parent category
          });
          subCount++;
        }
      }
    }

    // Display summary
    console.log(`\n🎉 Seeding Complete!`);
    console.log(`📁 Main Categories: ${parentCount}`);
    console.log(`📂 Subcategories: ${subCount}`);
    console.log(`📊 Total: ${parentCount + subCount}`);

    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the seeder
seedCategories();
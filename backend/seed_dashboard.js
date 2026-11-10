require('dotenv').config();
const connectDB = require('./db');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Sentiment = require('./models/Sentiment');

const productsData = [
  { brand: 'Samsung', model: 'Galaxy S24', year: 2024, os: 'Android 14', price: 74999, screen: 6.2, ram: 8, storage: 256, battery: 4000, camera: 50, front: 12, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 25 },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', year: 2024, os: 'Android 14', price: 124999, screen: 6.8, ram: 12, storage: 512, battery: 5000, camera: 200, front: 12, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 45 },
  { brand: 'Apple', model: 'iPhone 15', year: 2023, os: 'iOS 17', price: 79900, screen: 6.1, ram: 6, storage: 128, battery: 3349, camera: 48, front: 12, refresh: 60, chipset: 'A16 Bionic', fast: 20 },
  { brand: 'Apple', model: 'iPhone 15 Pro', year: 2023, os: 'iOS 17', price: 134900, screen: 6.1, ram: 8, storage: 256, battery: 3274, camera: 48, front: 12, refresh: 120, chipset: 'A17 Pro', fast: 27 },
  { brand: 'Google', model: 'Pixel 8', year: 2023, os: 'Android 14', price: 75999, screen: 6.2, ram: 8, storage: 128, battery: 4575, camera: 50, front: 10.5, refresh: 120, chipset: 'Tensor G3', fast: 27 },
  { brand: 'Google', model: 'Pixel 8 Pro', year: 2023, os: 'Android 14', price: 106999, screen: 6.7, ram: 12, storage: 256, battery: 5050, camera: 50, front: 10.5, refresh: 120, chipset: 'Tensor G3', fast: 30 },
  { brand: 'OnePlus', model: '12', year: 2024, os: 'Android 14', price: 64999, screen: 6.82, ram: 12, storage: 256, battery: 5400, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 100 },
  { brand: 'OnePlus', model: '12R', year: 2024, os: 'Android 14', price: 42999, screen: 6.78, ram: 8, storage: 256, battery: 5500, camera: 50, front: 16, refresh: 120, chipset: 'Snapdragon 8 Gen 2', fast: 100 },
  { brand: 'Xiaomi', model: '14', year: 2024, os: 'HyperOS', price: 69999, screen: 6.36, ram: 12, storage: 512, battery: 4610, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 90 },
  { brand: 'Xiaomi', model: '14 Ultra', year: 2024, os: 'HyperOS', price: 99999, screen: 6.73, ram: 16, storage: 512, battery: 5000, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 90 },
  { brand: 'Nothing', model: 'Phone (2)', year: 2023, os: 'Android 14', price: 42999, screen: 6.7, ram: 12, storage: 256, battery: 4700, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8+ Gen 1', fast: 45 },
  { brand: 'Nothing', model: 'Phone (2a)', year: 2024, os: 'Android 14', price: 27999, screen: 6.7, ram: 8, storage: 256, battery: 5000, camera: 50, front: 32, refresh: 120, chipset: 'Dimensity 7200 Pro', fast: 45 },
  { brand: 'Motorola', model: 'Edge 50 Pro', year: 2024, os: 'Android 14', price: 31999, screen: 6.7, ram: 8, storage: 256, battery: 4500, camera: 50, front: 50, refresh: 144, chipset: 'Snapdragon 7 Gen 3', fast: 125 },
  { brand: 'Motorola', model: 'Razr 50 Ultra', year: 2024, os: 'Android 14', price: 99999, screen: 6.9, ram: 12, storage: 512, battery: 4000, camera: 50, front: 32, refresh: 165, chipset: 'Snapdragon 8s Gen 3', fast: 45 },
  { brand: 'Realme', model: 'Narzo 70 Pro', year: 2024, os: 'Android 14', price: 19999, screen: 6.67, ram: 8, storage: 128, battery: 5000, camera: 50, front: 16, refresh: 120, chipset: 'Dimensity 7050', fast: 67 }
];

const userNames = ['Aarav', 'Diya', 'Kunal', 'Riya', 'Aman', 'Priya', 'Nikhil', 'Sneha', 'Vikram', 'Meera'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scoreToSentiment(index) {
  if (index % 10 < 6) return 'positive';
  if (index % 10 < 8) return 'neutral';
  return 'negative';
}

function makeReviewText(product, sentiment) {
  const full = `${product.brand} ${product.model}`;
  if (sentiment === 'positive') {
    return `${full} delivers strong battery backup, smooth ${product.rawSpecs.refreshRate}Hz display performance, and a reliable camera for daily photography.`;
  }
  if (sentiment === 'negative') {
    return `${full} needs better thermal tuning and low-light camera consistency. Performance dips during long gaming sessions.`;
  }
  return `${full} is balanced for the price with decent camera output and stable day-to-day performance, though software polish can improve.`;
}

function sentimentRating(sentiment) {
  if (sentiment === 'positive') return Number((4 + Math.random()).toFixed(1));
  if (sentiment === 'negative') return Number((2 + Math.random() * 0.8).toFixed(1));
  return Number((3 + Math.random() * 0.9).toFixed(1));
}

function confidence(sentiment) {
  if (sentiment === 'positive') return Number((0.84 + Math.random() * 0.14).toFixed(2));
  if (sentiment === 'negative') return Number((0.82 + Math.random() * 0.15).toFixed(2));
  return Number((0.7 + Math.random() * 0.16).toFixed(2));
}

async function run() {
  await connectDB();

  await Promise.all([
    Sentiment.deleteMany({}),
    Review.deleteMany({}),
    Product.deleteMany({})
  ]);

  const products = await Product.insertMany(
    productsData.map((p, idx) => ({
      sourceId: idx + 1,
      brand: p.brand,
      model: p.model,
      modelKey: `${p.brand.toLowerCase()} ${p.model.toLowerCase()}`,
      productTitle: `${p.brand} ${p.model}`,
      screenSize: p.screen,
      price: p.price,
      releaseYear: p.year,
      operatingSystem: p.os,
      rawSpecs: {
        ram: p.ram,
        storage: p.storage,
        batteryCapacity: p.battery,
        cameraMp: p.camera,
        frontCameraMp: p.front,
        refreshRate: p.refresh,
        weight: null,
        thickness: null,
        bodyMaterial: 'Glass + Metal',
        chipset: p.chipset,
        gpu: 'Adreno/Apple GPU',
        dualSim: 'Yes',
        networkSupport: '5G',
        bluetoothVersion: '5.3',
        wifiVersion: 'Wi-Fi 6E',
        usbType: 'USB-C',
        fastCharging: p.fast,
        fingerprintSensor: 'In-display'
      }
    }))
  );

  const reviewDocs = [];
  const sentimentDocs = [];

  for (const product of products) {
    for (let i = 0; i < 16; i += 1) {
      const sentiment = scoreToSentiment(i + product.sourceId);
      const review = await Review.create({
        productId: product._id,
        smartphoneId: product._id,
        userName: `${pick(userNames)} ${Math.floor(100 + Math.random() * 900)}`,
        reviewText: makeReviewText(product, sentiment),
        rating: sentimentRating(sentiment),
        sentimentLabel: sentiment,
        metadata: { source: 'dashboard-seed', reviewCountry: 'IN' }
      });

      reviewDocs.push(review);
      sentimentDocs.push({
        reviewId: review._id,
        productId: product._id,
        modelType: 'gemini',
        label: sentiment,
        confidence: confidence(sentiment),
        reason: sentiment === 'positive'
          ? 'Review indicates satisfaction with core performance and battery.'
          : sentiment === 'negative'
            ? 'Review highlights camera/thermal/performance concerns.'
            : 'Review includes mixed feedback without strong polarity.'
      });
    }
  }

  await Sentiment.insertMany(sentimentDocs);

  console.log('Dashboard dataset seeded successfully.');
  console.log(`Products: ${await Product.countDocuments()}`);
  console.log(`Reviews: ${await Review.countDocuments()}`);
  console.log(`Sentiments: ${await Sentiment.countDocuments({ modelType: 'gemini' })}`);

  process.exit(0);
}

run().catch((error) => {
  console.error('Dashboard seeding failed:', error.message);
  process.exit(1);
});

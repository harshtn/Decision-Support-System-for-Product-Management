require('dotenv').config();
const connectDB = require('./db');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Sentiment = require('./models/Sentiment');

const BRANDS = ['Samsung', 'Apple', 'Google', 'OnePlus', 'Xiaomi', 'Nothing', 'Motorola'];

const PRODUCT_BLUEPRINTS = [
  { brand: 'Samsung', model: 'Galaxy S24', year: 2024, os: 'Android 14', price: 74999, ram: 8, storage: 256, battery: 4000, camera: 50, front: 12, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 25, screen: 6.2 },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', year: 2024, os: 'Android 14', price: 124999, ram: 12, storage: 512, battery: 5000, camera: 200, front: 12, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 45, screen: 6.8 },
  { brand: 'Apple', model: 'iPhone 15', year: 2023, os: 'iOS 17', price: 79900, ram: 6, storage: 128, battery: 3349, camera: 48, front: 12, refresh: 60, chipset: 'A16 Bionic', fast: 20, screen: 6.1 },
  { brand: 'Apple', model: 'iPhone 15 Pro', year: 2023, os: 'iOS 17', price: 134900, ram: 8, storage: 256, battery: 3274, camera: 48, front: 12, refresh: 120, chipset: 'A17 Pro', fast: 27, screen: 6.1 },
  { brand: 'Google', model: 'Pixel 8', year: 2023, os: 'Android 14', price: 75999, ram: 8, storage: 128, battery: 4575, camera: 50, front: 10.5, refresh: 120, chipset: 'Tensor G3', fast: 27, screen: 6.2 },
  { brand: 'Google', model: 'Pixel 8 Pro', year: 2023, os: 'Android 14', price: 106999, ram: 12, storage: 256, battery: 5050, camera: 50, front: 10.5, refresh: 120, chipset: 'Tensor G3', fast: 30, screen: 6.7 },
  { brand: 'OnePlus', model: '12R', year: 2024, os: 'Android 14', price: 42999, ram: 8, storage: 256, battery: 5500, camera: 50, front: 16, refresh: 120, chipset: 'Snapdragon 8 Gen 2', fast: 100, screen: 6.78 },
  { brand: 'OnePlus', model: '12', year: 2024, os: 'Android 14', price: 64999, ram: 12, storage: 256, battery: 5400, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 100, screen: 6.82 },
  { brand: 'Xiaomi', model: '14', year: 2024, os: 'HyperOS', price: 69999, ram: 12, storage: 512, battery: 4610, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 90, screen: 6.36 },
  { brand: 'Xiaomi', model: '14 Ultra', year: 2024, os: 'HyperOS', price: 99999, ram: 16, storage: 512, battery: 5000, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8 Gen 3', fast: 90, screen: 6.73 },
  { brand: 'Nothing', model: 'Phone (2)', year: 2023, os: 'Android 14', price: 42999, ram: 12, storage: 256, battery: 4700, camera: 50, front: 32, refresh: 120, chipset: 'Snapdragon 8+ Gen 1', fast: 45, screen: 6.7 },
  { brand: 'Nothing', model: 'Phone (2a)', year: 2024, os: 'Android 14', price: 27999, ram: 8, storage: 256, battery: 5000, camera: 50, front: 32, refresh: 120, chipset: 'Dimensity 7200 Pro', fast: 45, screen: 6.7 },
  { brand: 'Motorola', model: 'Edge 50 Pro', year: 2024, os: 'Android 14', price: 31999, ram: 8, storage: 256, battery: 4500, camera: 50, front: 50, refresh: 144, chipset: 'Snapdragon 7 Gen 3', fast: 125, screen: 6.7 },
  { brand: 'Motorola', model: 'Razr 50 Ultra', year: 2024, os: 'Android 14', price: 99999, ram: 12, storage: 512, battery: 4000, camera: 50, front: 32, refresh: 165, chipset: 'Snapdragon 8s Gen 3', fast: 45, screen: 6.9 },
  { brand: 'Samsung', model: 'Galaxy A55', year: 2024, os: 'Android 14', price: 39999, ram: 8, storage: 256, battery: 5000, camera: 50, front: 32, refresh: 120, chipset: 'Exynos 1480', fast: 25, screen: 6.6 },
  { brand: 'Apple', model: 'iPhone 14', year: 2022, os: 'iOS 17', price: 59900, ram: 6, storage: 128, battery: 3279, camera: 12, front: 12, refresh: 60, chipset: 'A15 Bionic', fast: 20, screen: 6.1 },
  { brand: 'Google', model: 'Pixel 7a', year: 2023, os: 'Android 14', price: 43999, ram: 8, storage: 128, battery: 4385, camera: 64, front: 13, refresh: 90, chipset: 'Tensor G2', fast: 18, screen: 6.1 },
  { brand: 'OnePlus', model: 'Nord 4', year: 2024, os: 'Android 14', price: 29999, ram: 8, storage: 256, battery: 5500, camera: 50, front: 16, refresh: 120, chipset: 'Snapdragon 7+ Gen 3', fast: 100, screen: 6.74 },
  { brand: 'Xiaomi', model: 'Redmi Note 13 Pro+', year: 2024, os: 'HyperOS', price: 32999, ram: 12, storage: 256, battery: 5000, camera: 200, front: 16, refresh: 120, chipset: 'Dimensity 7200 Ultra', fast: 120, screen: 6.67 },
  { brand: 'Nothing', model: 'Phone (1)', year: 2022, os: 'Android 14', price: 24999, ram: 8, storage: 128, battery: 4500, camera: 50, front: 16, refresh: 120, chipset: 'Snapdragon 778G+', fast: 33, screen: 6.55 }
];

const USERS = [
  'Ananya P.', 'Rohit K.', 'Dev M.', 'Priya S.', 'Nikhil R.', 'Akash J.',
  'Mira T.', 'Kunal V.', 'Sana A.', 'Vikram D.', 'Isha N.', 'Harsh G.'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFrom(min, max) {
  return min + Math.random() * (max - min);
}

function sentimentProfile(index) {
  if (index % 10 < 6) return 'positive';
  if (index % 10 < 8) return 'neutral';
  return 'negative';
}

function buildReviewText(product, sentiment) {
  const title = `${product.brand} ${product.model}`;
  const positives = [
    `The ${title} feels premium and the ${product.refresh}Hz display is very smooth in daily use.`,
    `Battery backup has been reliable and ${product.fast}W charging is genuinely useful for quick top-ups.`,
    `Camera output is sharp in daylight and performance with ${product.chipset} stays consistent.`
  ];
  const neutrals = [
    `${title} is good overall, but heat management under long gaming sessions is average.`,
    `The phone is balanced for this price, though low-light camera results are only okay.`,
    `Performance is stable for everyday apps, but software updates could be faster.`
  ];
  const negatives = [
    `I expected better battery optimization; standby drain is noticeable and software feels unfinished.`,
    `Camera processing in low light is inconsistent and the phone warms up during recording.`,
    `For this price, performance dips during heavy multitasking and the display brightness could be better.`
  ];

  if (sentiment === 'positive') return pick(positives);
  if (sentiment === 'negative') return pick(negatives);
  return pick(neutrals);
}

function ratingFor(sentiment) {
  if (sentiment === 'positive') return Number(randomFrom(4.1, 5).toFixed(1));
  if (sentiment === 'negative') return Number(randomFrom(1.8, 2.9).toFixed(1));
  return Number(randomFrom(3.0, 4.0).toFixed(1));
}

function confidenceFor(sentiment) {
  if (sentiment === 'positive') return Number(randomFrom(0.82, 0.98).toFixed(2));
  if (sentiment === 'negative') return Number(randomFrom(0.8, 0.97).toFixed(2));
  return Number(randomFrom(0.7, 0.88).toFixed(2));
}

function reasonFor(sentiment) {
  if (sentiment === 'positive') return 'Review highlights strengths in battery, performance, and camera quality.';
  if (sentiment === 'negative') return 'Review points to issues in thermal behavior, software polish, or camera consistency.';
  return 'Review mixes pros and cons without a strongly polarized sentiment.';
}

async function seedShowcaseData() {
  await connectDB();

  await Promise.all([
    Sentiment.deleteMany({}),
    Review.deleteMany({}),
    Product.deleteMany({})
  ]);

  const products = await Product.insertMany(
    PRODUCT_BLUEPRINTS.map((item, idx) => ({
      sourceId: idx + 1,
      brand: item.brand,
      model: item.model,
      modelKey: `${item.brand.toLowerCase()} ${item.model.toLowerCase()}`,
      productTitle: `${item.brand} ${item.model}`,
      screenSize: item.screen,
      price: item.price,
      releaseYear: item.year,
      operatingSystem: item.os,
      rawSpecs: {
        ram: item.ram,
        storage: item.storage,
        batteryCapacity: item.battery,
        cameraMp: item.camera,
        frontCameraMp: item.front,
        refreshRate: item.refresh,
        weight: null,
        thickness: null,
        bodyMaterial: 'Aluminum + Glass',
        chipset: item.chipset,
        gpu: 'Adreno / Apple GPU',
        dualSim: 'Yes',
        networkSupport: '5G',
        bluetoothVersion: '5.3',
        wifiVersion: 'Wi-Fi 6E',
        usbType: 'USB-C',
        fastCharging: item.fast,
        fingerprintSensor: 'In-display'
      }
    }))
  );

  const reviewDocs = [];
  const sentimentDocs = [];

  for (const product of products) {
    for (let i = 0; i < 12; i += 1) {
      const sentiment = sentimentProfile(i + product.sourceId);
      const review = await Review.create({
        smartphoneId: product._id,
        productId: product._id,
        userName: pick(USERS),
        reviewText: buildReviewText(product, sentiment),
        rating: ratingFor(sentiment),
        sentimentLabel: sentiment,
        metadata: {
          source: 'showcase-seed',
          reviewCountry: 'IN'
        }
      });

      reviewDocs.push(review);
      sentimentDocs.push({
        reviewId: review._id,
        productId: product._id,
        modelType: 'gemini',
        label: sentiment,
        confidence: confidenceFor(sentiment),
        reason: reasonFor(sentiment)
      });
    }
  }

  await Sentiment.insertMany(sentimentDocs);

  const totalProducts = await Product.countDocuments();
  const totalReviews = await Review.countDocuments();
  const totalSentiments = await Sentiment.countDocuments({ modelType: 'gemini' });

  console.log('Showcase data seeded successfully.');
  console.log(`Products: ${totalProducts}`);
  console.log(`Reviews: ${totalReviews}`);
  console.log(`Sentiments: ${totalSentiments}`);

  process.exit(0);
}

seedShowcaseData().catch((error) => {
  console.error('Showcase seed failed:', error.message);
  process.exit(1);
});

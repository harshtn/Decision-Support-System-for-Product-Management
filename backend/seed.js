require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Smartphone = require('./models/Smartphone');
const Review = require('./models/Review');
const Analysis = require('./models/Analysis');

const seedData = async () => {
  await connectDB();

  // Clear existing
  await Smartphone.deleteMany();
  await Review.deleteMany();
  await Analysis.deleteMany();

  const phone1 = await Smartphone.create({
    modelName: 'Galaxy S24 Ultra', brand: 'Samsung', price: 1299,
    specs: { display: '6.8" AMOLED', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '512GB', battery: '5000mAh', camera: '200MP Main + 50MP Telephoto' },
    aspectRatings: { battery: 8.5, camera: 9.5, performance: 9.8, display: 9.9, valueForMoney: 7.5 }
  });

  const phone2 = await Smartphone.create({
    modelName: 'iPhone 15 Pro Max', brand: 'Apple', price: 1199,
    specs: { display: '6.7" OLED', processor: 'A17 Pro', ram: '8GB', storage: '256GB', battery: '4422mAh', camera: '48MP Main + 12MP Telephoto' },
    aspectRatings: { battery: 8.8, camera: 9.4, performance: 9.7, display: 9.5, valueForMoney: 7.8 }
  });

  const phone3 = await Smartphone.create({
    modelName: 'Pixel 8 Pro', brand: 'Google', price: 999,
    specs: { display: '6.7" OLED', processor: 'Tensor G3', ram: '12GB', storage: '128GB', battery: '5050mAh', camera: '50MP Main' },
    aspectRatings: { battery: 7.9, camera: 9.6, performance: 8.5, display: 9.0, valueForMoney: 8.2 }
  });

  await Review.create({ smartphoneId: phone1._id, userName: 'TechEnthusiast', reviewText: 'Incredible camera setup, but the battery could last longer on 5G. Display is unmatched.', sentimentScore: 0.8 });
  await Review.create({ smartphoneId: phone1._id, userName: 'JaneDoe33', reviewText: 'Performance is extremely snappy. Heavy gaming handles like a breeze.', sentimentScore: 0.9 });
  await Review.create({ smartphoneId: phone2._id, userName: 'AppleFan88', reviewText: 'Solid upgrade. The titanium finish is great and battery life easily gets me through the day.', sentimentScore: 0.85 });
  await Review.create({ smartphoneId: phone3._id, userName: 'PixelPeep', reviewText: 'AI features are cool, but the processor gets hot compared to Snapdragon.', sentimentScore: 0.4 });

  await Analysis.create({
    targetModel: 'Google Pixel 8 Pro', competitorModel: 'Samsung Galaxy S24 Ultra',
    insights: 'Based on 5,430 reviews, Pixel 8 Pro leads in AI-assisted camera features but falls significantly behind the S24 Ultra in thermal management and raw CPU performance metrics under sustained loads.',
    aspectImprovements: [
      { aspect: 'Performance', suggestion: 'Enhance vapor chamber cooling and refine Tensor G4 efficiency to reduce thermal throttling.' },
      { aspect: 'Battery', suggestion: 'Increase capacity or optimize idle drain to hit the 9/10 satisfaction benchmark set by competition.' }
    ]
  });

  console.log('Database seeded perfectly!');
  process.exit();
};

seedData();

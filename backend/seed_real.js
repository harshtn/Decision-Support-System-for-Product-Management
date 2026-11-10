const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Smartphone = require('./models/Smartphone');
const Review = require('./models/Review');
const AnalysisResult = require('./models/Analysis');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartphone-analyzer')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const SMARTPHONES_CSV = path.join(__dirname, '../smartphones.csv');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeAspectRatings(row) {
  const batteryScore = Math.min(10, Math.max(4, toNumber(row.battery_capacity) / 700));
  const cameraScore = Math.min(10, Math.max(4, toNumber(row.camera_mp) / 12));
  const performanceBase = Math.min(10, Math.max(4, toNumber(row.ram) / 1.2));
  const displayScore = Math.min(10, Math.max(4, toNumber(row.refresh_rate) / 18));
  const price = toNumber(row.price);

  let valueForMoney = 7.2;
  if (price > 90000) valueForMoney = 5.8;
  else if (price > 60000) valueForMoney = 6.5;
  else if (price > 35000) valueForMoney = 7.4;
  else if (price > 18000) valueForMoney = 8.2;
  else valueForMoney = 8.8;

  return {
    battery: Number(batteryScore.toFixed(1)),
    camera: Number(cameraScore.toFixed(1)),
    performance: Number(performanceBase.toFixed(1)),
    display: Number(displayScore.toFixed(1)),
    valueForMoney: Number(valueForMoney.toFixed(1))
  };
}

function sentimentFromValue(score) {
  if (score >= 8.2) return 'positive';
  if (score <= 5.9) return 'negative';
  return 'neutral';
}

function buildSyntheticReviews(phoneDoc) {
  const rating = phoneDoc.aspectRatings;
  const model = phoneDoc.modelName;

  return [
    {
      smartphoneId: phoneDoc._id,
      userName: 'Dataset Insight',
      reviewText: `${model} delivers ${rating.battery >= 7 ? 'strong' : 'average'} battery life and ${rating.performance >= 7 ? 'smooth' : 'mixed'} daily performance for its segment.`,
      sentimentScore: Number(((rating.battery + rating.performance) / 20).toFixed(2)),
      aspectSentiments: {
        battery: sentimentFromValue(rating.battery),
        camera: sentimentFromValue(rating.camera),
        performance: sentimentFromValue(rating.performance),
        display: sentimentFromValue(rating.display)
      }
    },
    {
      smartphoneId: phoneDoc._id,
      userName: 'Market Snapshot',
      reviewText: `${model} offers a ${rating.camera >= 7 ? 'capable' : 'modest'} camera setup with a ${rating.valueForMoney >= 7.5 ? 'very competitive' : 'premium-leaning'} value profile.`,
      sentimentScore: Number(((rating.camera + rating.valueForMoney) / 20).toFixed(2)),
      aspectSentiments: {
        battery: sentimentFromValue(rating.battery),
        camera: sentimentFromValue(rating.camera),
        performance: sentimentFromValue(rating.performance),
        display: sentimentFromValue(rating.display)
      }
    }
  ];
}

async function importData() {
  try {
    await Smartphone.deleteMany();
    await Review.deleteMany();
    await AnalysisResult.deleteMany();
    console.log('Cleared existing data.');

    const groupedPhones = new Map();

    console.log('Importing smartphones from smartphones.csv...');
    await new Promise((resolve, reject) => {
      fs.createReadStream(SMARTPHONES_CSV)
        .pipe(csv())
        .on('data', (row) => {
          const brand = (row.brand_name || '').trim();
          const model = (row.model || '').trim();
          if (!brand || !model) return;

          const key = `${brand}__${model}`;
          if (!groupedPhones.has(key)) {
            groupedPhones.set(key, []);
          }
          groupedPhones.get(key).push(row);
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    const phonesToInsert = [];
    for (const rows of groupedPhones.values()) {
      const base = rows[0];
      const averagePrice = rows.reduce((sum, current) => sum + toNumber(current.price), 0) / rows.length;

      const rowForRatings = {
        battery_capacity: Math.round(rows.reduce((sum, current) => sum + toNumber(current.battery_capacity), 0) / rows.length),
        camera_mp: Math.round(rows.reduce((sum, current) => sum + toNumber(current.camera_mp), 0) / rows.length),
        ram: Math.round(rows.reduce((sum, current) => sum + toNumber(current.ram), 0) / rows.length),
        refresh_rate: Math.round(rows.reduce((sum, current) => sum + toNumber(current.refresh_rate), 0) / rows.length),
        price: averagePrice
      };

      phonesToInsert.push({
        modelName: `${base.brand_name} ${base.model}`,
        brand: base.brand_name,
        price: Math.round(averagePrice),
        releaseYear: toNumber(base.release_year, null),
        operatingSystem: base.operating_system || 'N/A',
        screenSize: toNumber(base.screen_size, null),
        rawSpecs: {
          ram: toNumber(base.ram, null),
          storage: toNumber(base.storage, null),
          batteryCapacity: toNumber(base.battery_capacity, null),
          cameraMp: toNumber(base.camera_mp, null),
          frontCameraMp: toNumber(base.front_camera_mp, null),
          refreshRate: toNumber(base.refresh_rate, null),
          weight: toNumber(base.weight, null),
          thickness: toNumber(base.thickness, null),
          bodyMaterial: base.body_material || 'N/A',
          chipset: base.chipset || 'N/A',
          gpu: base.gpu || 'N/A',
          dualSim: base.dual_sim || 'N/A',
          networkSupport: base.network_support || 'N/A',
          bluetoothVersion: base.bluetooth_version || 'N/A',
          wifiVersion: base.wifi_version || 'N/A',
          usbType: base.usb_type || 'N/A',
          fastCharging: toNumber(base.fast_charging, null),
          fingerprintSensor: base.fingerprint_sensor || 'N/A'
        },
        specs: {
          display: `${base.screen_size || 'N/A'} inch • ${base.refresh_rate || 'N/A'}Hz • ${base.operating_system || 'N/A'}`,
          processor: `${base.chipset || 'N/A'} • ${base.gpu || 'N/A'}`,
          ram: `${base.ram || 'N/A'}GB`,
          storage: `${base.storage || 'N/A'}GB`,
          battery: `${base.battery_capacity || 'N/A'}mAh • ${base.fast_charging || 'N/A'}W`,
          camera: `${base.camera_mp || 'N/A'}MP rear • ${base.front_camera_mp || 'N/A'}MP front`
        },
        aspectRatings: computeAspectRatings(rowForRatings)
      });
    }

    const phoneDocs = await Smartphone.insertMany(phonesToInsert);
    console.log(`Imported ${phoneDocs.length} smartphones.`);

    console.log('Generating compatible synthetic reviews...');
    const reviews = phoneDocs.flatMap((phoneDoc) => buildSyntheticReviews(phoneDoc));

    await Review.insertMany(reviews);
    console.log(`Imported ${reviews.length} reviews.`);

    console.log('Database seeded successfully from smartphones.csv!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

importData();

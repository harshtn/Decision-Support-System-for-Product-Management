const mongoose = require('mongoose');

const smartphoneSchema = new mongoose.Schema({
  modelName: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  price: { type: Number, default: 0 },
  releaseYear: Number,
  operatingSystem: String,
  screenSize: Number,
  rawSpecs: {
    ram: Number,
    storage: Number,
    batteryCapacity: Number,
    cameraMp: Number,
    frontCameraMp: Number,
    refreshRate: Number,
    weight: Number,
    thickness: Number,
    bodyMaterial: String,
    chipset: String,
    gpu: String,
    dualSim: String,
    networkSupport: String,
    bluetoothVersion: String,
    wifiVersion: String,
    usbType: String,
    fastCharging: Number,
    fingerprintSensor: String
  },
  specs: {
    display: String,
    processor: String,
    ram: String,
    storage: String,
    battery: String,
    camera: String,
  },
  aspectRatings: {
    battery: { type: Number, min: 0, max: 10, default: 0 },
    camera: { type: Number, min: 0, max: 10, default: 0 },
    performance: { type: Number, min: 0, max: 10, default: 0 },
    display: { type: Number, min: 0, max: 10, default: 0 },
    valueForMoney: { type: Number, min: 0, max: 10, default: 0 }
  }
}, { timestamps: true });

smartphoneSchema.index({ modelName: 1 });
smartphoneSchema.index({ brand: 1 });
smartphoneSchema.index({ price: 1 });
smartphoneSchema.index({ releaseYear: -1 });

module.exports = mongoose.model('Smartphone', smartphoneSchema);

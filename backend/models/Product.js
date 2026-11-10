const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sourceId: { type: Number, index: true },
    brand: { type: String, trim: true, index: true },
    model: { type: String, trim: true, required: true, index: true },
    modelKey: { type: String, trim: true, index: true },
    productTitle: { type: String, trim: true },
    screenSize: Number,
    price: Number,
    releaseYear: Number,
    operatingSystem: String,
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

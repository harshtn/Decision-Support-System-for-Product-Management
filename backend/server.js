require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const smartphoneRoutes = require('./routes/smartphones');
const companyRoutes = require('./routes/company');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/smartphones', smartphoneRoutes);
app.use('/api/company', companyRoutes);
app.use('/api', productRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const dbHost = NODE_ENV === 'production' 
      ? (process.env.PROD_DB_HOST || '127.0.0.1')
      : (process.env.DEV_DB_HOST || '127.0.0.1');
    const dbName = process.env.DB_NAME || 'voip';
    
    console.log(`Connecting to MongoDB at ${dbHost}:27017/${dbName} (${NODE_ENV} mode)`);
    
    await mongoose.connect(`mongodb://${dbHost}:27017/${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB; 
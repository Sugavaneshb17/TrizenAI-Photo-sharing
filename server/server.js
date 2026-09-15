const app = require('./src/app');
const connectDB = require('./src/config/db');

require('dotenv').config();

const startServer = async () => {
  await connectDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer();

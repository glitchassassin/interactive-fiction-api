import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  gamePath: process.env.GAME_PATH || path.join(process.cwd(), 'games'),
  isDevelopment: process.env.NODE_ENV !== 'production',
};

export default config; 
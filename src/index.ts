import { buildApp } from './app';
import config from './config';
import frotzService from './services/frotz.service';

const app = buildApp();

// Start the server
const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    
    // Set up a periodic cleanup of inactive processes
    setInterval(() => {
      frotzService.cleanupInactiveProcesses();
    }, 5 * 60 * 1000); // Run every 5 minutes
    
    console.log(`Server is running on ${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 
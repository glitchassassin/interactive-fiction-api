import fastify from 'fastify';
import cors from '@fastify/cors';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import routes from './routes';
import config from './config';

export function buildApp() {
  const app = fastify({
    logger: {
      level: config.isDevelopment ? 'debug' : 'info',
    }
  }).withTypeProvider<JsonSchemaToTsProvider>();
  
  // Register plugins
  app.register(cors, {
    origin: true // Allow all origins in development
  });
  
  // Register routes
  app.register(routes);
  
  return app;
} 
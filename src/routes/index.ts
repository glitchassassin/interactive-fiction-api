import { FastifyInstance } from 'fastify';
import sessionsRoutes from './sessions';

export default async function (fastify: FastifyInstance) {
  // Register session routes
  fastify.register(sessionsRoutes, { prefix: '/sessions' });
  
  // Health check route
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });
} 
import { FastifyInstance } from "fastify";
import sessionsRoutes from "./sessions";

export default async function (fastify: FastifyInstance) {
  // Register session routes
  fastify.register(sessionsRoutes, { prefix: "/sessions" });

  // Health check route
  fastify.get(
    "/health",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["system"],
        response: {
          200: {
            description: "Successful response",
            type: "object",
            properties: {
              status: { type: "string" },
            },
          },
        },
      },
    },
    async () => {
      return { status: "ok" };
    }
  );
}

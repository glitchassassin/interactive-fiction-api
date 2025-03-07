import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import fastify from "fastify";
import config from "./config";
import routes from "./routes";

export function buildApp() {
  const app = fastify({
    logger: {
      level: config.isDevelopment ? "debug" : "info",
    },
  }).withTypeProvider<JsonSchemaToTsProvider>();

  // Register plugins
  app.register(cors, {
    origin: true, // Allow all origins in development
  });

  // Register Swagger
  app.register(swagger, {
    swagger: {
      info: {
        title: "Interactive Fiction API",
        description: "API for interacting with interactive fiction games",
        version: "1.0.0",
      },
      externalDocs: {
        url: "https://github.com/yourusername/interactive-fiction-api",
        description: "Find more info here",
      },
      host: `${config.host}:${config.port}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "sessions", description: "Game session related endpoints" },
        { name: "system", description: "System related endpoints" },
      ],
    },
  });

  // Register Swagger UI
  app.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Register routes
  app.register(routes);

  // Hook to generate Swagger documentation
  app.ready((err) => {
    if (err) throw err;
    app.swagger();
    app.log.info("Swagger documentation is available at /documentation");
  });

  return app;
}

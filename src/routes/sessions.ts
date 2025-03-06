import sessionService from "../services/session.service";
import {
  createSessionSchema,
  sendCommandSchema,
  getTranscriptSchema,
} from "../schemas/sessions";
import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async function (fastify) {
  // Create a new session
  fastify.post(
    "/",
    {
      schema: createSessionSchema,
    },
    async (request, reply) => {
      try {
        const { gameName } = request.body;
        const result = await sessionService.createSession(gameName);
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: "Failed to create session" });
      }
    }
  );

  // Send a command to a session
  fastify.post("/:sessionId/command", {
    schema: sendCommandSchema,
    handler: async (request, reply) => {
      try {
        const { sessionId } = request.params;
        const { command } = request.body;
        const result = await sessionService.sendCommand(sessionId, command);
        return result;
      } catch (error) {
        fastify.log.error(error);

        if ((error as Error).message.includes("not found")) {
          reply.status(404).send({ error: "Session not found" });
          return;
        }

        reply.status(500).send({ error: "Failed to send command" });
      }
    },
  });

  // Get session transcript
  fastify.get("/:sessionId/transcript", {
    schema: getTranscriptSchema,
    handler: async (request, reply) => {
      try {
        const { sessionId } = request.params;
        const { page, limit } = request.query;

        const transcript = await sessionService.getTranscript(sessionId, {
          page,
          limit,
        });

        return transcript;
      } catch (error) {
        fastify.log.error(error);

        if ((error as Error).message.includes("not found")) {
          reply.status(404).send({ error: "Session not found" });
          return;
        }

        reply.status(500).send({ error: "Failed to get transcript" });
      }
    },
  });
};

export default plugin;

import { PrismaClient } from "@prisma/client";
import { FromSchema } from "json-schema-to-ts";
import {
  commandResponseSchema,
  createSessionResponseSchema,
  transcriptResponseSchema,
} from "../schemas/sessions";
import frotzService from "./frotz.service";

const prisma = new PrismaClient();

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

class SessionService {
  /**
   * Create a new game session
   * @param gameName The name of the game file
   * @returns The session ID and initial output
   */
  async createSession(
    gameName: string
  ): Promise<FromSchema<typeof createSessionResponseSchema>> {
    // Create a new session in the database
    const session = await prisma.session.create({
      data: {},
    });

    try {
      // Start the game
      const output = await frotzService.startGame(session.id, gameName);

      // Return the session ID and initial output
      return {
        sessionId: session.id,
        output,
      };
    } catch (error) {
      // Clean up the session if there was an error
      await prisma.session.delete({
        where: { id: session.id },
      });

      throw error;
    }
  }

  /**
   * Send a command to a game session
   * @param sessionId The session ID
   * @param command The command to send
   * @returns The output from the game
   */
  async sendCommand(
    sessionId: string,
    command: string
  ): Promise<FromSchema<typeof commandResponseSchema>> {
    // Check if the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Send the command to the game
    const output = await frotzService.sendCommand(sessionId, command);

    // Store the interaction in the database
    await prisma.interaction.create({
      data: {
        sessionId,
        command,
        response: output,
      },
    });

    // Return the output
    return { output };
  }

  /**
   * Get the transcript for a session
   * @param sessionId The session ID
   * @param options Pagination options
   * @returns The transcript
   */
  async getTranscript(
    sessionId: string,
    options: PaginationOptions = {}
  ): Promise<FromSchema<typeof transcriptResponseSchema>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Check if the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get the total count of interactions
    const totalCount = await prisma.interaction.count({
      where: { sessionId },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Get the interactions for the current page
    const interactions = await prisma.interaction.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
      skip,
      take: limit,
      select: {
        command: true,
        response: true,
        timestamp: true,
      },
    });

    // Return the transcript with timestamp converted to ISO string
    return {
      page,
      totalPages,
      interactions: interactions.map((interaction) => ({
        command: interaction.command,
        response: interaction.response,
        timestamp: interaction.timestamp.toISOString(),
      })),
    };
  }

  /**
   * Terminate a session
   * @param sessionId The session ID
   */
  async terminateSession(sessionId: string): Promise<void> {
    // Check if the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Terminate the frotz process
    frotzService.terminateProcess(sessionId);
  }
}

export default new SessionService();

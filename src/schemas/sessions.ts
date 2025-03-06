import { FastifySchema } from "fastify";

// Common schemas
export const sessionIdParam = {
  type: "object",
  required: ["sessionId"],
  properties: {
    sessionId: { type: "string" },
  },
} as const;

export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
} as const;

// Create session schemas
export const createSessionBodySchema = {
  type: "object",
  required: ["gameName"],
  properties: {
    gameName: { type: "string" },
  },
} as const;

export const createSessionResponseSchema = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
    output: { type: "string" },
  },
} as const;

export const createSessionSchema = {
  body: createSessionBodySchema,
  response: {
    200: createSessionResponseSchema,
    500: errorResponse,
  },
} as const satisfies FastifySchema;

// Send command schemas
export const commandBodySchema = {
  type: "object",
  required: ["command"],
  properties: {
    command: { type: "string" },
  },
} as const;

export const commandResponseSchema = {
  type: "object",
  properties: {
    output: { type: "string" },
  },
} as const;

export const sendCommandSchema = {
  params: sessionIdParam,
  body: commandBodySchema,
  response: {
    200: commandResponseSchema,
    404: errorResponse,
    500: errorResponse,
  },
} as const satisfies FastifySchema;

// Transcript schemas
export const transcriptQuerystringSchema = {
  type: "object",
  properties: {
    page: { type: "number", minimum: 1 },
    limit: { type: "number", minimum: 1 },
  },
} as const;

export const interactionSchema = {
  type: "object",
  properties: {
    command: { type: "string" },
    response: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
  },
} as const;

export const transcriptResponseSchema = {
  type: "object",
  properties: {
    page: { type: "number" },
    totalPages: { type: "number" },
    interactions: {
      type: "array",
      items: interactionSchema,
    },
  },
} as const;

export const getTranscriptSchema = {
  params: sessionIdParam,
  querystring: transcriptQuerystringSchema,
  response: {
    200: transcriptResponseSchema,
    404: errorResponse,
    500: errorResponse,
  },
} as const satisfies FastifySchema;

# Interactive Fiction API Implementation Plan

## Overview

This document outlines the implementation plan for creating an API interface to dfrotz (dumb frotz), allowing interaction with interactive fiction games over a RESTful API. The system will be containerized using Docker and will provide endpoints for creating game sessions, sending commands, and retrieving transcripts.

## Technology Stack

- **Backend**: TypeScript with Fastify
- **Database**: SQLite with Prisma ORM
- **Environment**: Docker
- **Testing**: Playwright
- **Interactive Fiction Interpreter**: dfrotz (dumb frotz)

## Project Structure

```
interactive-fiction-api/
├── src/
│   ├── index.ts                # Main application entry point
│   ├── app.ts                  # Fastify app setup
│   ├── routes/                 # API routes
│   │   ├── sessions.ts         # Session-related endpoints
│   │   └── index.ts            # Route registration
│   ├── services/
│   │   ├── frotz.service.ts    # Service for interacting with dfrotz
│   │   └── session.service.ts  # Service for managing sessions
│   ├── models/
│   │   └── types.ts            # TypeScript type definitions
│   └── config/
│       └── index.ts            # Application configuration
├── prisma/
│   ├── schema.prisma           # Prisma schema definition
│   └── migrations/             # Database migrations
├── tests/
│   ├── api/                    # API tests using Playwright
│   └── unit/                   # Unit tests
├── scripts/
│   └── build-frotz.sh          # Script to build dfrotz
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose configuration
├── .env.example                # Environment variables example
├── package.json                # Node.js dependencies
└── tsconfig.json               # TypeScript configuration
```

## Database Schema

We'll use Prisma with SQLite to store session data:

```prisma
model Session {
  id            String    @id @default(uuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  gameState     Bytes?    # To store game state if needed
  interactions  Interaction[]
}

model Interaction {
  id            Int       @id @default(autoincrement())
  sessionId     String
  command       String
  response      String
  timestamp     DateTime  @default(now())
  session       Session   @relation(fields: [sessionId], references: [id])
}
```

## API Endpoints

### 1. Create a New Session

**Endpoint**: `POST /sessions/`

**Response**:
```json
{
  "sessionId": "uuid-string",
  "output": "Welcome to the game..."
}
```

### 2. Send a Command to a Session

**Endpoint**: `POST /sessions/:sessionId/command`

**Request**:
```json
{
  "command": "look around"
}
```

**Response**:
```json
{
  "output": "You are in a small room..."
}
```

### 3. Get Session Transcript

**Endpoint**: `GET /sessions/:sessionId/transcript`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```json
{
  "page": 1,
  "totalPages": 5,
  "interactions": [
    {
      "command": "look around",
      "response": "You are in a small room...",
      "timestamp": "2023-08-15T10:30:00Z"
    },
    // ...more interactions
  ]
}
```

## Implementation Approach

### 1. Docker Setup

1. Create a Dockerfile that:
   - Uses a base Node.js image
   - Installs necessary dependencies for building dfrotz
   - Builds dfrotz from source
   - Sets up the Node.js environment
   - Configures a volume mount for game files
   - Sets the GAME_PATH environment variable

2. Create a docker-compose.yml file for local development that:
   - Defines the API service
   - Mounts volumes for game files and source code
   - Sets environment variables

### 2. dfrotz Integration

1. Create a service that:
   - Spawns a dfrotz process using Node.js child_process
   - Communicates with dfrotz via stdin/stdout
   - Parses output from dfrotz to distinguish between game content and prompts
   - Manages multiple dfrotz instances for concurrent sessions

2. Implement a session management system that:
   - Creates new game instances
   - Routes commands to the correct game instance
   - Stores game output in the database
   - Handles session cleanup and resource management

### 3. API Implementation

1. Set up a Fastify server with:
   - Request validation using JSON Schema
   - Error handling
   - Logging
   - Health checks

2. Implement the session endpoints:
   - POST /sessions/ to create a new game session
   - POST /sessions/:sessionId/command to send commands
   - GET /sessions/:sessionId/transcript to retrieve the transcript

3. Implement database operations using Prisma:
   - Session creation
   - Command logging
   - Transcript retrieval with pagination

### 4. Testing Strategy

1. Unit Tests:
   - Test individual services and functions
   - Mock dfrotz process for predictable testing

2. API Tests using Playwright:
   - Test the API endpoints
   - Validate responses
   - Test error conditions and edge cases

3. Integration Tests:
   - Test the complete flow from session creation to command execution
   - Validate transcript retrieval

## Development Phases

### Phase 1: Setup and Basic Implementation
1. Set up project structure and dependencies
2. Create Docker configuration
3. Implement basic dfrotz interaction service
4. Create Prisma schema and generate client

### Phase 2: Core API Functionality
1. Implement session creation endpoint
2. Implement command execution endpoint
3. Implement transcript retrieval endpoint
4. Add basic error handling and validation

### Phase 3: Testing and Refinement
1. Write unit tests for services
2. Create Playwright tests for API endpoints
3. Refine error handling and input validation
4. Optimize dfrotz interaction

### Phase 4: Documentation and Deployment
1. Document API endpoints
2. Create deployment instructions
3. Finalize Docker configuration
4. Add monitoring and health checks

## Considerations and Challenges

1. **Process Management**: Efficiently managing multiple dfrotz processes for concurrent sessions.
2. **Output Parsing**: Correctly parsing dfrotz output to distinguish between game content and prompts.
3. **Error Handling**: Gracefully handling errors from dfrotz and returning appropriate responses.

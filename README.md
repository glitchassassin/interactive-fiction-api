# Interactive Fiction API

A RESTful API for interacting with interactive fiction games using dfrotz (dumb frotz).

## Features

- Create game sessions
- Send commands to games
- Retrieve game transcripts
- Containerized with Docker

## Requirements

- Node.js 18+
- Docker (for containerized deployment)
- Interactive fiction game files (.z5, .z8, etc.)

## Development Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/interactive-fiction-api.git
   cd interactive-fiction-api
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   ```
   cp .env.example .env
   ```

4. Place your game files in the `games` directory.

5. Generate Prisma client:

   ```
   npm run prisma:generate
   ```

6. Run database migrations:

   ```
   npm run prisma:migrate
   ```

7. Start the development server:
   ```
   npm run dev
   ```

## Docker Deployment

1. Build the Docker image:

   ```
   docker build -t interactive-fiction-api .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 -v ./games:/app/games interactive-fiction-api
   ```

Alternatively, use Docker Compose:

```
docker-compose up
```

## API Endpoints

### Create a New Session

**Endpoint**: `POST /sessions/`

**Request**:

```json
{
  "gameName": "zork1.z3"
}
```

**Response**:

```json
{
  "sessionId": "uuid-string",
  "output": "Welcome to the game..."
}
```

### Send a Command to a Session

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

### Get Session Transcript

**Endpoint**: `GET /sessions/:sessionId/transcript?page=1&limit=20`

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
    }
    // ...more interactions
  ]
}
```

## License

MIT

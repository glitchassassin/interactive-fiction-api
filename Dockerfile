FROM node:20-slim

# Install dependencies for building dfrotz
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    make \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy build script and run it
COPY scripts/build-frotz.sh /app/scripts/
RUN chmod +x /app/scripts/build-frotz.sh && /app/scripts/build-frotz.sh

# Create directory for game files
RUN mkdir -p /app/games

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV GAME_PATH=/app/games

# Start the application
CMD ["npm", "start"] 
# Use official Node.js 20 slim image
FROM node:20-slim

# Install system dependencies for Puppeteer (headless Chromium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxrender1 \
    libxtst6 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies (includes Puppeteer which downloads matching Chromium)
RUN npm install

# Copy Prisma folder first and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# Expose port (Cloud Run will override this via $PORT env var)
EXPOSE 5001

# Command to start the server
CMD ["npm", "start"]

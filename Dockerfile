# Use Node.js LTS version as base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including nodemon
RUN npm install

# Copy source code
COPY . .

# Expose port (adjust if needed)
EXPOSE 3005

# Start server using nodemon
CMD ["npm", "run", "dev"]

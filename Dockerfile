# Use the official Node.js image as the base image
FROM node:20

# Set timezone environment variable
ENV TZ=America/Sao_Paulo

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Build the NestJS application
RUN npm run build

# Copy migrations and config to dist folder for production
RUN cp -r migrations dist/
RUN cp typeorm-cli.config.* dist/ 2>/dev/null || true

# Verify build output and migrations
RUN ls -la dist/
RUN ls -la dist/migrations/ || echo "Migrations directory not found"

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["./start.sh"]
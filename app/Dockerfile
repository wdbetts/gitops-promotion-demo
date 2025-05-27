FROM node:slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Version can be overridden at build time
ENV APP_VERSION=1.0.0

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "app.js"]

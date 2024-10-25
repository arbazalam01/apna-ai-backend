# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install PM2 globally
RUN npm install -g pm2

# Copy the rest of the application code
COPY . .

# Copy the firebaseAdminServiceKey.json file
COPY src/config/firebaseAdminServiceKey.json ./src/config/firebaseAdminServiceKey.json

# Build the application
RUN npm run build

# Ensure the firebaseAdminServiceKey.json file is in the dist directory
RUN cp ./src/config/firebaseAdminServiceKey.json ./dist/config/firebaseAdminServiceKey.json

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application using PM2
CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]
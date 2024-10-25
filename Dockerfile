FROM node:18

WORKDIR /aibiliti

COPY package*.json /aibiliti

RUN npm install

# Install PM2 globally
RUN npm install -g pm2

COPY . .

EXPOSE 3001

# Start the application with PM2
CMD ["pm2-runtime", "index.js"]

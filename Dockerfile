FROM node:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 80
CMD [ "npm", "start" ]

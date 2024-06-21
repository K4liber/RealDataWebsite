FROM node:20.14.0-alpine3.20
RUN npm install -g http-server
WORKDIR /app
COPY package*.json ./
COPY dist dist
EXPOSE 8080
CMD [ "npm", "start" ]

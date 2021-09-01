FROM node:lts-alpine
RUN npm install -g http-server
WORKDIR /app
COPY package*.json ./
COPY dist dist
EXPOSE 8080
CMD [ "npm", "start" ]

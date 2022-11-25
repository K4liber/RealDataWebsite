FROM node:14-alpine as build
WORKDIR /app
ARG token
ENV NPM_TOKEN $token
ENV PATH="/app/node_modules/.bin:$PATH"
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --ignore-scripts
COPY . ./
RUN npm run build

FROM nginx:1.22-alpine
COPY --from=build /app/dist/website_angular /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ./entry_point.sh /
RUN chmod +x entry_point.sh
EXPOSE 80
ENTRYPOINT sh entry_point.sh
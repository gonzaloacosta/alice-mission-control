FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_CORE_NAME=ALICE
ARG VITE_CREATOR_NAME=Gonzalo
ENV VITE_CORE_NAME=$VITE_CORE_NAME
ENV VITE_CREATOR_NAME=$VITE_CREATOR_NAME
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

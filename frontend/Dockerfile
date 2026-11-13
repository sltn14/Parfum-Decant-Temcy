# Frontend: build statis dengan Vite, disajikan Nginx. Konfigurasi Nginx (HTTPS, proxy /api,
# /uploads, /socket.io) dipasang lewat volume dari docker-compose.yml (deploy/nginx.conf).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Variabel VITE_* ditanam saat build, jadi harus diberikan sebagai build arg
ARG VITE_API_URL
ARG VITE_MIDTRANS_CLIENT_KEY
ENV VITE_API_URL=$VITE_API_URL VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443

# Backend Decant Temcy (Express 5, Node >= 18). Belum pernah di-build dari sandbox: uji di mesinmu.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
# Folder unggahan gambar produk/avatar; di-mount sebagai volume agar tidak hilang saat container diganti
RUN mkdir -p uploads/products uploads/avatars && chown -R node:node /app
USER node
EXPOSE 5000
CMD ["node", "src/app.js"]

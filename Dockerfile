FROM node:24-bookworm-slim

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4310

EXPOSE 4310

CMD ["npm", "start"]

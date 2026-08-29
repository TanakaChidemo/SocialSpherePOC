# -------- base --------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# -------- development --------
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# -------- build (prod deps only) --------
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --omit=dev

# -------- production --------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY . .
EXPOSE 4000
USER node
CMD ["node", "src/index.js"]

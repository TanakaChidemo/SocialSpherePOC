# -------- base --------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# -------- development --------
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# -------- build --------
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# -------- production --------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
EXPOSE 3000
USER node
CMD ["npm", "start"]

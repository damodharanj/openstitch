# Build stage for client
FROM node:20-alpine as client-build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY schema/ ./schema

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Pass the VITE_CLERK_PUBLISHABLE_KEY at build time
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy root package files
COPY package*.json ./
# Install ALL dependencies (including devDependencies like tsx for now, to keep it simple as per plan)
# In a stricter setup we might compile TS, but tsx is fine for "easy hosting".
RUN npm install --legacy-peer-deps

# Copy server source
COPY server/ ./server/
COPY schema/ ./schema/
COPY tsconfig.json ./

# Copy built client assets
COPY --from=client-build /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "server:prod"]

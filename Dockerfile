# ---------- Step 1: Build ----------
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json ./

RUN npm install

# Copy rest of the frontend code
COPY . .

# Build Vite app
RUN npm run build


# ---------- Step 2: Serve ----------
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from previous step
COPY --from=build /app/dist /usr/share/nginx/html

# Expose frontend port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

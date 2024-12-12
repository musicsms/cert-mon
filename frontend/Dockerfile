# Build stage
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Add non-root user
RUN adduser -D -H -u 101 -s /sbin/nologin nginx

# Use non-root user
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

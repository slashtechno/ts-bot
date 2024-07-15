FROM node:current-alpine
USER root

# https://docs.docker.com/language/nodejs/containerize/

# https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production
ENV NODE_ENV production

WORKDIR /app

# Mount package.json and package-lock.json
# Mount /root/.npm as a cache, install dependencies, and build the app
# The mounts are scoped to this RUN command
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && \
    npm install --global typescript


# Copy source code
COPY . .

# Build
RUN mkdir -p dist
RUN --mount=type=bind,source=package.json,target=package.json \
    npm run build

EXPOSE 3000


ENTRYPOINT ["node", "."]

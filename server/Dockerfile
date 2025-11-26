FROM node:18-slim

# set working directory
WORKDIR /usr/src/app

# set production env by default
ENV NODE_ENV=production

# allow port to be overridden at build/run time
ARG PORT=3000
ENV PORT=$PORT

# install dependencies based on package-lock if present
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

# copy application source
COPY _shared_temp ../shared
COPY . .
EXPOSE 3000

# start the app
CMD ["node", "index.js"]

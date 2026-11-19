# The image of the production server (Cloud Run service mjrp-proxy).
#
# The only recipe that builds it is scripts/deploy-server.sh, which runs
# `gcloud run deploy --source server` from a clean copy of `main`. Before that it
# stages, inside this folder, what the server needs from outside it:
#   _shared_temp/  the repository's shared/ modules, with a package.json marking them as ES modules
#   config/        the repository's config/ (prompts.json)
# Building this folder without that staging fails at the COPY of _shared_temp.
#
# Node version: 24, a supported line, chosen by the owner on 2026-11-19 (ADR-0020). It was 18
# (past its end of life) until then. The tests run on the developer's Node (26 on 2026-11-19).
FROM node:24-slim

# set working directory
WORKDIR /usr/src/app

# set production env by default
ENV NODE_ENV=production

# allow port to be overridden at build/run time
ARG PORT=3000
ENV PORT=$PORT

# install the production dependencies exactly as package-lock.json says
COPY package*.json ./
RUN npm ci --omit=dev

# copy application source
COPY _shared_temp ../shared
COPY . .
EXPOSE 3000

# start the app
CMD ["node", "index.js"]

# The image of the production server (Cloud Run service mjrp-proxy).
#
# The only recipe that builds it is scripts/deploy-server.sh, which runs
# `gcloud run deploy --source server` from a clean copy of `main`. Before that it
# stages, inside this folder, what the server needs from outside it:
#   _shared_temp/  the repository's shared/ modules, with a package.json marking them as ES modules
#   config/        the repository's config/ (prompts.json)
# Building this folder without that staging fails at the COPY of _shared_temp.
#
# Node version: keep it equal to the one used to develop and to run the tests
# (.github/workflows/ci.yml), on a release line that is still supported.
FROM node:26-slim

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

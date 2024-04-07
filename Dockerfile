FROM node:lts-alpine as installer

WORKDIR /

COPY package.json .
COPY package-lock.json .
RUN npm i
# COPY /node_modules ./node_modules

FROM installer as builder
WORKDIR /

COPY src src
COPY tsconfig.json .
COPY tsconfig.prod.json .
COPY webpack.config.cjs .
RUN npm run build

FROM node:lts-alpine
WORKDIR /pizi-server

COPY --from=builder /dist ./server
COPY --from=builder package.json ./server
COPY --from=builder /node_modules ./node_modules
COPY configs/dev/pizi-server/certificates ./certificates

EXPOSE 2200
CMD [ "node", "--experimental-specifier-resolution=node", "/pizi-server/server" ]
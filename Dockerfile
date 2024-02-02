FROM node:21-alpine3.17 as installer

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
RUN npm run build

FROM node:21-alpine3.17
WORKDIR /pizi-server

COPY --from=builder /dist ./server
COPY --from=builder package.json ./server
COPY --from=builder /node_modules ./node_modules
COPY configs/dev/pizi-server/certificates ./certificates
RUN mv ./node_modules/pizi-server-app/dist ./server-app

EXPOSE 2200
CMD [ "node", "--experimental-specifier-resolution=node", "/pizi-server/server" ]
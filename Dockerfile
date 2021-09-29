# ADMIN
FROM node:16.10.0 as build_admin
WORKDIR /usr/src
RUN npm set unsafe-perm true

COPY . ./
RUN npm install
RUN npx lerna bootstrap

WORKDIR /usr/src/admin
RUN npm run build


# SERVER
FROM rust:latest AS build
WORKDIR /usr/src

COPY . ./
COPY --from=build_admin /usr/src/admin/build /usr/src/admin/build

RUN cargo build -p vulpo_server --release



FROM ubuntu:latest
COPY --from=build /usr/src/target/release/vulpo_server .
RUN apt-get update
RUN apt-get -y install libssl-dev
RUN apt-get -y install libpq-dev
ENV VULPO_SERVER_ADDRESS='0.0.0.0'
CMD ["./vulpo_server", "server"]

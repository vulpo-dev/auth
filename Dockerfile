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

# Copy the statically-linked binary into a scratch container.
FROM ubuntu:latest
COPY --from=build /usr/src/target/release/vulpo_server .
RUN apt-get update
RUN apt-get -y install libssl-dev
RUN apt-get -y install libpq-dev
CMD ["./vulpo_server", "server"]

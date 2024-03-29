# Assets
FROM node:16.10.0 as build_assets

ARG version
ENV VulpoAuthVersion=$version

WORKDIR /usr/src
RUN npm set unsafe-perm true

COPY . ./
RUN npm install
RUN npx lerna bootstrap

WORKDIR /usr/src/admin
RUN npm run build

WORKDIR /usr/src/packages/email-templates
RUN npm run build


# SERVER
FROM clux/muslrust:1.68.2 AS build

ARG version
ENV VulpoAuthVersion=$version

WORKDIR /usr/src

COPY . ./
COPY --from=build_assets /usr/src/admin/dist /usr/src/admin/dist
COPY --from=build_assets /usr/src/packages/email-templates/build /usr/src/packages/email-templates/build

RUN cargo build -p vulpo_server --release

# Copy the statically-linked binary into a scratch container.
FROM scratch
COPY --from=build /usr/src/target/x86_64-unknown-linux-musl/release/vulpo_server /vulpo_server
ENV VULPO_SERVER_ADDRESS='0.0.0.0'
CMD ["./vulpo_server", "server"]

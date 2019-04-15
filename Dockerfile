FROM node:10.15-alpine AS build-env

ADD . /app
WORKDIR /app
RUN yarn install; yarn run build

FROM node:10.15-alpine

COPY --from=build-env /app/bin /app/bin
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/node_modules /app/node_modules
COPY --from=build-env /app/package.json /app/package.json
WORKDIR /app

EXPOSE 8000
ENTRYPOINT ["/app/bin/iov-faucet"]
CMD [""]

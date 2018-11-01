FROM node:10.12.0-alpine AS build-env
# leveldown dependency requires python
RUN apk --update --no-cache add python build-base

ADD . /app
WORKDIR /app
RUN yarn install; yarn run build

FROM node:10.12.0-alpine

COPY --from=build-env /app/bin /app/bin
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/node_modules /app/node_modules
WORKDIR /app

EXPOSE 8000
ENTRYPOINT [ "/app/bin/iov-faucet"]
CMD [""]

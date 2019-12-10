# IOV-Faucet

[![Build Status](https://travis-ci.com/iov-one/iov-faucet.svg?branch=master)](https://travis-ci.com/iov-one/iov-faucet)
[![Docker Pulls](https://img.shields.io/docker/pulls/iov1/iov-faucet.svg)](https://hub.docker.com/r/iov1/iov-faucet/)

The usage of this faucet is very simple, to install it, run:

```
yarn install
yarn build
```

Then start it for a IOV development blockchain using:

```
yarn dev-start
```

Make sure to take note of the passphrase used, as this is the only time it will
be displayed.

Advanced users that want to provide their own passphrase can do so like this:

```
yarn install
yarn build
FAUCET_MNEMONIC="<secret mnemonic>" ./bin/iov-faucet start <codec> <chain url>
```

## Usage

```
Usage: iov-faucet action [arguments...]

Positional arguments per action are listed below. Arguments in parentheses are optional.

help      Shows a help text and exits

version   Prints the version and exits

generate  Generates a random mnemonic, shows derived faucet addresses and exits
           1  Codec
           2  Chain ID

start     Starts the faucet
           1  Codec
           2  Node base URL, e.g. wss://bov.friendnet-fast.iov.one

Environment variables

FAUCET_CONCURRENCY        Number of distributor accounts. Defaults to 5.
FAUCET_PORT               Port of the webserver. Defaults to 8000.
FAUCET_MNEMONIC           Secret mnemonic that serves as the base secret for the
                          faucet HD accounts
FAUCET_CREDIT_AMOUNT_TKN  Send this amount of TKN to a user requesting TKN. TKN is
                          a placeholder for the token ticker. Defaults to 10.
FAUCET_REFILL_FACTOR      Send factor times credit amount on refilling. Defauls to 8.
FAUCET_REFILL_THRESHOLD   Refill when balance gets below factor times credit amount.
                          Defaults to 20.
```

### Development

The yarn script `dev-start` calls `start` with a set of default options for
local development. It uses a development mnemonic, the BNS codec and the node
`ws://localhost:23456`.

```
yarn install
yarn build
yarn dev-start
```

### Faucet HD wallet

The faucet uses standard HD paths for each blockchain, e.g.

```
IOV        m/44'/234'/a'
Lisk       m/44'/134'/a'
Ethereum   m/44'/60'/0'/0/a
```

where `a` is a 0-based index of the account. Account 0 is the token holder and
account 1...FAUCET_CONCURRENCY are the distributor accounts.

This means the token holder account can be accessed using the Neuma wallet when
the same mnemonic is used. Accessing the distributor accounts will be possible
as soon as there is
[multi account support](https://github.com/iov-one/ponferrada/milestone/3).

### Working with docker

- Build an artifact

```bash
docker build -t iov1/iov-faucet:manual .
```

- Version and help

```bash
docker run --read-only --rm iov1/iov-faucet:manual version
docker run --read-only --rm iov1/iov-faucet:manual help
```

- Run faucet

```bash
FAUCET_MNEMONIC="degree tackle suggest window test behind mesh extra cover prepare oak script" docker run --read-only \
  -e FAUCET_MNEMONIC \
  -p 8000:8000 \
  --rm iov1/iov-faucet:manual \
  start bns wss://bov.friendnet-fast.iov.one
```

### Using the faucet

Now that the faucet has been started up, you can send credit requests to it.
This can be done with a simple http POST request. These commands assume the
faucet is running locally, be sure to change it from `localhost` if your
situation is different.

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"ticker":"CASH","address":"tiov1k898u78hgs36uqw68dg7va5nfkgstu5z0fhz3f"}' \
  http://localhost:8000/credit
```

### Checking the faucets status

The faucet provides a simple status check in the form of an http GET request. As
above, make sure to adjust the URL as necessary.

```
curl http://localhost:8000/status
```

## Versions and compatibility overview

| iov-faucet | IOV-Core | BNSd support    | New features                                                              |
| ---------- | -------- | --------------- | ------------------------------------------------------------------------- |
| 0.10.x     | 1.2.x    | 0.22.x          | `FAUCET_INSTANCE` and `FAUCET_COIN_TYPE` config removed; HD paths changed |
| 0.9.x      | 0.17.x   | 0.21.x          |                                                                           |
| 0.8.x      | 0.16.x   | 0.19.x – 0.20.x |                                                                           |
| 0.7.x      | 0.15.x   | 0.16.x          |                                                                           |
| 0.6.x      | 0.14.x   | 0.14.x          | BNS fee support                                                           |
| 0.5.x      | 0.12.x   | 0.10.x – 0.11.x |                                                                           |
| 0.4.x      | 0.11.x   | 0.4.x – 0.9.x   | Ethereum support                                                          |
| 0.3.x      | 0.9.x    | 0.4.x – 0.9.x   |                                                                           |

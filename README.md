# IOV-Faucet

The usage of this faucet is very simple, to install it, run:

```
yarn install
yarn build
```

Then start it for a IOV development blockchain using:

```
yarn dev-init
yarn dev-refill
yarn dev-start
```

Make sure to take note of the passphrase used, as this is the only time it will be displayed.

Advanced users that want to provide their own passphrase can do so like this:

```
yarn install
yarn build
./bin/iov-faucet init db/<dbname> <db password> <codec> "<passphrase goes here>"
```

Ensure that the db is not there, otherwise the application will throw. This is to prevent overwriting existing databases.

## Usage

```
Usage: iov-faucet action [arguments...]

Positional arguments per action are listed below. Arguments in parentheses are optional.

help      Shows a help text and exits

version   Prints the version and exits

init      Initializes the faucet and exits
           1  Database file path
           2  Database encryption password
           3  Codec
          (4) custom mnemonic

start     Starts the faucet
           1  Database file path
           2  Database encryption password
           3  Codec
           4  Node base URL, e.g. wss://bov.friendnet-fast.iov.one

refill    Fills all distribution accounts from the holder account and exits.
          This is a no-op when already filled. Run this in a cronjob.
           1  Database file path
           2  Database encryption password
           3  Codec
           4  Node base URL, e.g. wss://bov.friendnet-fast.iov.one

Environment variables

FAUCET_COIN_TYPE      Coin type of the faucet (see README). Defaults to 1.
FAUCET_INSTANCE       Instance number of the faucet for load balancing. Defaults to 0.
FAUCET_CONCURRENCY    Number of distributor accounts. Defaults to 5.
FAUCET_PORT           Port of the webserver. Defaults to 8000.
```

### Development

The yarn scripts `dev-init` and `dev-start` call `init` and `start` with
a set of default options for local development. It uses a weak password,
the BNS codec and the node `ws://localhost:22345`.

```
yarn install
yarn build
yarn dev-init
yarn dev-start
```

### Faucet HD wallet

One instance of the faucet can serve multiple tokens on a single blockchain. Multiple
instances can be created for load balaning. The faucet is powered by a SLIP-0010 wallet
such that all chains and all instances can use a single secret mnemonic.
The BIP43 compliant HD derivation path of faucet is

```
m / purpose' / coin_type' / instance_index' / account_index'
```

with

* `purpose`: 1229936198 (big endian of ascii "IOVF")
* `coin_type`: from SLIP-0044 or custom value. This describes the blockchain, not
  the token. All tokens in one instance are served from a single coin type. Note that
  SLIP-0044 suggests value `1` for all testnets.
* `instance_index`: 0-based index of the instance
* `account_index`: 0-based index of the account. Account 0 is the token holder and
   account 1...FAUCET_CONCURRENCY are the distributor accounts.

### Using the faucet

Now that the faucet has been started up, you can send credit requests to it. This can be done with a simple http POST request. These commands assume the faucet is running locally, be sure to change it from `localhost` if your situation is different.

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"ticker":"CASH","address":"tiov1k898u78hgs36uqw68dg7va5nfkgstu5z0fhz3f"}' \
  http://localhost:8000/credit
```

### Checking the faucets status

The faucet provides a simple status check in the form of an http GET request. As above, make sure to adjust the URL as necessary.

```
curl http://localhost:8000/status
```

### Future Support

In the future, it will be possible to tell the faucet to only use specific networks. Right now it automatically connects to all known chains.

# IOV-Faucet

The usage of this faucet is very simple, to install it, run:

```
yarn install
yarn build
```

Then start it up using:

```
yarn dev-init
yarn dev-start
```

Make sure to take note of the passphrase used, as this is the only time it will be displayed.

Advanced users that want to provide their own passphrase can do so like this:

```
yarn install
yarn build
node build/index.js init db/<dbname> <db password> <codec> "<passphrase goes here>"
```

Ensure that the db is not there, otherwise the application will throw. This is to prevent overwriting existing databases.

## Usage

```
Usage: action [arguments...]

Positional arguments per action are listed below. Arguments in parentheses are optional.

help        Shows a help text and exists

version     Prints the version and exists

init        Initializes the faucet and exists
             1  Database file path
             2  Database encryption password
             3  Codec
            (4) custom mnemonic

start       Starts the faucet
             1  Database file path
             2  Database encryption password
             3  Codec
             4  Node base URL, e.g. wss://bov.friendnet-fast.iov.one
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

### Using the faucet

Now that the faucet has been started up, you can send credit requests to it. This can be done with a simple http POST request. These commands assume the faucet is running locally, be sure to change it from `localhost` if your situation is different.

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"ticker":"CASH","address":"tiov1k898u78hgs36uqw68dg7va5nfkgstu5z0fhz3f"}' \
  http://localhost:8000/getTokens
```

Applicable chainIds:

```
IOV Related
chain-friendnet-fast
chain-friendnet-slow

Lisk
da3ed6a45429278bac2666961289ca17ad86595d33b31037615d4b8e8f158bba
```

### Checking the faucets status

The faucet provides a simple status check in the form of an http GET request. As above, make sure to adjust the URL as necessary.

```
curl http://localhost:8000/state
```

### Future Support

In the future, it will be possible to tell the faucet to only use specific networks. Right now it automatically connects to all known chains.

export function help(): void {
  const out = `
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

FAUCET_COIN_TYPE          Coin type of the faucet (see README). Defaults to 1.
FAUCET_INSTANCE           Instance number of the faucet for load balancing.
                          Defaults to 0.
FAUCET_CONCURRENCY        Number of distributor accounts. Defaults to 5.
FAUCET_PORT               Port of the webserver. Defaults to 8000.
FAUCET_MNEMONIC           Secret mnemonic that serves as the base secret for the
                          faucet HD accounts
FAUCET_CREDIT_AMOUNT_TKN  Send this amount of TKN to a user requesting TKN. TKN is
                          a placeholder for the token ticker. Defaults to 10.
FAUCET_REFILL_FACTOR      Send factor times credit amount on refilling. Defauls to 8.
FAUCET_REFILL_THRESHOLD   Refill when balance gets below factor times credit amount.
                          Defaults to 20.
`.trim();

  process.stdout.write(`${out}\n`);
}

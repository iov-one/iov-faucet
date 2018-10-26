export function help(): void {
  const out = `
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
`.trim();

  process.stdout.write(`${out}\n`);
}

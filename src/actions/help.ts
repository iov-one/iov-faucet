export function help(): void {
  const out = `
Usage: action [arguments...]

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
`.trim();

  process.stdout.write(`${out}\n`);
}

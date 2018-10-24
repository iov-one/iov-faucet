import { initialize, start } from "./actions";
import { codecFromString } from "./codec";
import * as constants from "./constants";

function main(args: ReadonlyArray<string>): void {
  if (args.length < 4) {
    throw Error("Not enough arguments. See documentation on github for arguments");
  }

  const action = args[0];
  const filename = args[1];
  const password = args[2];
  const codec = codecFromString(args[3]);

  switch (action) {
    case "initialize":
      const userMnemonic: string | undefined = args[4];
      initialize(filename, password, codec, userMnemonic).catch(error => {
        console.error(error);
      });
      break;
    case "start":
      const blockchainBaseUrl: string = args[4];
      start(filename, password, codec, blockchainBaseUrl, constants.port).catch(error => {
        console.error(error);
      });
      break;
    default:
      throw new Error("Unexpected action argument");
  }
}

main(process.argv.slice(2));

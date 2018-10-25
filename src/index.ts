import { init, start } from "./actions";
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
    case "init":
      const userMnemonic: string | undefined = args[4];
      init(filename, password, codec, userMnemonic).catch(error => {
        console.error(error);
      });
      break;
    case "start":
      if (args.length < 5) {
        throw Error(`Not enough arguments for action '${action}'. See README for arguments`);
      }
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

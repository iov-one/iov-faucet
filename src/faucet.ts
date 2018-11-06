import { help, start, version } from "./actions";

export function main(args: ReadonlyArray<string>): void {
  if (args.length < 1) {
    help();
    process.exit(1);
    return;
  }

  const action = args[0];
  const restArgs = args.slice(1);

  switch (action) {
    case "help":
      help();
      break;
    case "version":
      version().catch(error => {
        console.error(error);
        process.exit(1);
      });
      break;
    case "start":
      start(restArgs).catch(error => {
        console.error(error);
        process.exit(1);
      });
      break;
    default:
      throw new Error("Unexpected action argument");
  }
}

export const enum Codec {
  Bns,
  Lisk,
}

export function codecFromString(input: string): Codec {
  switch (input) {
    case "bns":
      return Codec.Bns;
    case "lisk":
      return Codec.Lisk;
    default:
      throw new Error(`Codec '${input}' not supported`);
  }
}

declare module "jaro-winkler" {
  interface JaroWinklerOptions {
    caseSensitive?: boolean;
  }

  export default function distance(
    first: string,
    second: string,
    options?: JaroWinklerOptions,
  ): number;
}


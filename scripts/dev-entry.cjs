// Ensures the nvm Node bin is on PATH before launching Next (matches the
// health-upgrade setup). Keeps the preview sandbox from losing `node` for any
// child processes Next spawns.
process.env.PATH = `/Users/ema/.nvm/versions/node/v24.18.0/bin:${process.env.PATH || ""}`;
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("../node_modules/next/dist/bin/next");

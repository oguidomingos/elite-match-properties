// pm2: serviço elite-match (SSR TanStack Start, preset node-server).
// Lê o .env em runtime para não versionar segredos no config.
const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = loadEnv(path.join(__dirname, ".env"));

module.exports = {
  apps: [
    {
      name: "elite-match",
      cwd: __dirname,
      script: ".output/server/index.mjs",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        ...env,
        NODE_ENV: "production",
        PORT: env.PORT || "3071",
        HOST: env.HOST || "127.0.0.1",
      },
    },
  ],
};

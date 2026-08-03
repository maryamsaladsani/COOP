const app = require("./src/app");
const env = require("./src/config/env");

app.listen(env.port, () => {
  console.log(`[server] listening on port ${env.port}`);
});

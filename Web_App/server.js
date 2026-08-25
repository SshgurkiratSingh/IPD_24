const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const express = require("express");
const backendApp = require("./server/index");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Mount backend API routes. They already use /api/v1 etc.
  server.use("/", backendApp);

  // Next.js fallback for all other routes
  server.all("*", (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});

import { spawn } from "node:child_process";
import os from "node:os";
import net from "node:net";
import qrcode from "qrcode-terminal";
import { fileURLToPath } from "node:url";

async function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "0.0.0.0");
  });
}

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] ?? []) {
      const isIpv4 = net.family === "IPv4" || net.family === 4;
      if (isIpv4 && !net.internal && net.address !== "127.0.0.1") return net.address;
    }
  }
  return "127.0.0.1";
}

async function findPort(start) {
  for (let p = start; p < start + 20; p++) {
    if (await portFree(p)) return p;
  }
  return start;
}

const ip = getLanIp();
const port = await findPort(Number(process.env.PORT || 5173));
const url = `http://${ip}:${port}`;

console.log("\n  Mobile dev URL: " + url);
console.log("  (Phone and PC must be on the same network)\n");
qrcode.generate(url, { small: true });
console.log("  Scan the QR code above on your phone to open the app.\n");

const viteBin = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));

const server = spawn(process.execPath, [viteBin, "--host", "0.0.0.0", "--port", String(port), "--strictPort"], { stdio: "inherit" });
server.on("close", (code) => process.exit(code ?? 0));
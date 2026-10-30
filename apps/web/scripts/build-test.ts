import { spawn } from "node:child_process";
import { testEnvironment } from "./test-env";
const child = spawn("pnpm", ["run", "build"], {
  env: testEnvironment,
  stdio: "inherit",
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

import fs from "fs";
import path from "path";

const publicDir = path.join(process.cwd(), "public");
const distDir = path.join(process.cwd(), "dist/public");

fs.mkdirSync(distDir, { recursive: true });

fs.readdirSync(publicDir).forEach(file => {
  if (!file.endsWith(".ts")) {
    fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
  }
});

console.log("Copied HTML/CSS to dist/public");

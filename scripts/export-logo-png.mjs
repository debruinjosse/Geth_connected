/**
 * Renders HD PNGs from the canonical SVG for favicons and raster fallbacks.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const projectRoot = process.cwd();
const svgPath = path.join(projectRoot, "public", "assets", "geth-logo-official.svg");
const svg = readFileSync(svgPath, "utf8");

function exportPng(width, fileName) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "transparent"
  });
  const png = resvg.render().asPng();
  const out = path.join(projectRoot, "public", "assets", fileName);
  writeFileSync(out, png);
  console.log(`Wrote ${fileName} (${width}px wide, ${png.length} bytes)`);
}

exportPng(512, "geth-logo-official-512.png");
exportPng(256, "geth-logo-official-256.png");
exportPng(512, "geth-crest-mark.png");

const appIcon = path.join(projectRoot, "app", "icon.png");
writeFileSync(appIcon, readFileSync(path.join(projectRoot, "public", "assets", "geth-logo-official-512.png")));
console.log("Updated app/icon.png");

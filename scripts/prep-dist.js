#!/usr/bin/env node
// =====================================================================
//  prep-dist — stage the game for the Tauri desktop build.
//
//  index.html stays the ONE source of truth at the project root. Tauri
//  wants a folder to treat as the web "dist", so we just copy the file
//  (and anything else the shipped client needs) into ./dist right before
//  `tauri dev` / `tauri build`. Nothing here is hand-edited; re-run any
//  time the game changes.
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

fs.mkdirSync(dist, { recursive: true });

// The whole game is a single file. If that ever changes, add more copies here.
const assets = ["index.html"];
for (const name of assets) {
  fs.copyFileSync(path.join(root, name), path.join(dist, name));
  console.log(`prep-dist: ${name} -> dist/${name}`);
}

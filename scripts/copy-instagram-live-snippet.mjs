#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const snippetPath = path.join(currentDir, "instagram-live-followback-snippet.js");
const snippet = fs.readFileSync(snippetPath, "utf8");

if (copyToClipboard(snippet)) {
  console.log("Copied Instagram live checker to your clipboard.");
  console.log("Open your Instagram profile, open DevTools Console, paste, and press Enter.");
} else {
  console.log("Could not copy to the clipboard automatically.");
  console.log(`Open this file and paste its contents into Instagram's DevTools Console:\n${snippetPath}`);
}

function copyToClipboard(text) {
  if (process.platform === "win32") {
    return runClipboardCommand("clip.exe", [], text);
  }

  if (process.platform === "darwin") {
    return runClipboardCommand("pbcopy", [], text);
  }

  return (
    runClipboardCommand("wl-copy", [], text) ||
    runClipboardCommand("xclip", ["-selection", "clipboard"], text) ||
    runClipboardCommand("xsel", ["--clipboard", "--input"], text)
  );
}

function runClipboardCommand(command, args, input) {
  const result = spawnSync(command, args, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "ignore", "ignore"],
  });

  return result.status === 0;
}

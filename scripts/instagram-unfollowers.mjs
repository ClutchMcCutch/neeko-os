#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(args.length === 0 ? 1 : 0);
}

const inputPath = path.resolve(args[0]);
const outputArgIndex = args.findIndex((arg) => arg === "--out" || arg === "-o");
const outputPath =
  outputArgIndex !== -1 && args[outputArgIndex + 1]
    ? path.resolve(args[outputArgIndex + 1])
    : null;

try {
  const entries = getReadableEntries(inputPath);
  const relationshipFiles = findRelationshipFiles(entries);

  if (relationshipFiles.followers.length === 0 || relationshipFiles.following.length === 0) {
    const seen = entries
      .map((entry) => entry.name)
      .filter((name) => /\.(json|html?)$/i.test(name))
      .slice(0, 20);

    throw new Error(
      [
        "Could not find both followers and following files.",
        "Export Instagram data as JSON if possible, and include Followers and following.",
        seen.length ? `Readable data files found:\n${seen.map((name) => `  - ${name}`).join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  const followers = collectUsers(relationshipFiles.followers);
  const following = collectUsers(relationshipFiles.following);
  const notFollowingBack = [...following.keys()]
    .filter((username) => !followers.has(username))
    .sort((a, b) => a.localeCompare(b));

  const report = [
    `Followers: ${followers.size}`,
    `Following: ${following.size}`,
    `Not following back: ${notFollowingBack.length}`,
    "",
    ...notFollowingBack.map((username) => `@${username}`),
  ].join("\n");

  console.log(report);

  if (outputPath) {
    fs.writeFileSync(outputPath, `${report}\n`, "utf8");
    console.log(`\nSaved report to ${outputPath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function printUsage() {
  console.log(`
Usage:
  npm run ig:unfollowers -- <instagram-export.zip|extracted-folder> [--out unfollowers.txt]

Instagram export tips:
  1. Request your Instagram information from Accounts Center.
  2. Choose "Some of your information" and include "Followers and following".
  3. Pick JSON format if Instagram gives you a choice.
  4. Run this script against the downloaded ZIP or extracted folder.
`);
}

function getReadableEntries(targetPath) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Input does not exist: ${targetPath}`);
  }

  const stats = fs.statSync(targetPath);

  if (stats.isDirectory()) {
    return listDirectoryEntries(targetPath);
  }

  if (stats.isFile() && /\.zip$/i.test(targetPath)) {
    return listZipEntries(fs.readFileSync(targetPath));
  }

  throw new Error("Input must be an Instagram export .zip file or an extracted folder.");
}

function listDirectoryEntries(rootPath) {
  const entries = [];
  const pending = [rootPath];

  while (pending.length > 0) {
    const current = pending.pop();

    for (const dirent of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, dirent.name);

      if (dirent.isDirectory()) {
        pending.push(fullPath);
        continue;
      }

      if (dirent.isFile()) {
        entries.push({
          name: path.relative(rootPath, fullPath).replaceAll(path.sep, "/"),
          readText: () => fs.readFileSync(fullPath, "utf8"),
        });
      }
    }
  }

  return entries;
}

function listZipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = [];
  let offset = centralDirectoryOffset;

  for (let i = 0; i < entryCount; i += 1) {
    assertSignature(buffer, offset, 0x02014b50, "central directory");

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer.toString("utf8", nameStart, nameStart + nameLength);

    if (!name.endsWith("/")) {
      entries.push({
        name,
        readText: () => inflateZipEntry(buffer, localHeaderOffset, compressedSize, method).toString("utf8"),
      });
    }

    offset = nameStart + nameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error("Could not read ZIP file. Try extracting it first, then run the script on the folder.");
}

function inflateZipEntry(buffer, localHeaderOffset, compressedSize, method) {
  assertSignature(buffer, localHeaderOffset, 0x04034b50, "local file header");

  const nameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

  if (method === 0) {
    return compressed;
  }

  if (method === 8) {
    return zlib.inflateRawSync(compressed);
  }

  throw new Error(`Unsupported ZIP compression method ${method}. Extract the ZIP first and try the folder.`);
}

function assertSignature(buffer, offset, expected, label) {
  if (buffer.readUInt32LE(offset) !== expected) {
    throw new Error(`Invalid ZIP ${label}. Try extracting the ZIP first, then run the script on the folder.`);
  }
}

function findRelationshipFiles(entries) {
  return {
    followers: entries.filter((entry) => isFollowersPath(entry.name)),
    following: entries.filter((entry) => isFollowingPath(entry.name)),
  };
}

function isFollowersPath(name) {
  const lower = name.toLowerCase().replaceAll("\\", "/");
  const base = lower.split("/").pop();
  return /^followers(?:_\d+)?\.(json|html?)$/.test(base);
}

function isFollowingPath(name) {
  const lower = name.toLowerCase().replaceAll("\\", "/");
  const base = lower.split("/").pop();
  return /^following(?:_\d+)?\.(json|html?)$/.test(base);
}

function collectUsers(entries) {
  const users = new Map();

  for (const entry of entries) {
    const usernames = /\.json$/i.test(entry.name)
      ? extractUsersFromJson(entry.readText(), entry.name)
      : extractUsersFromHtml(entry.readText());

    for (const username of usernames) {
      const normalized = normalizeUsername(username);

      if (normalized) {
        users.set(normalized, true);
      }
    }
  }

  return users;
}

function extractUsersFromJson(text, fileName) {
  let data;

  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(`Could not parse JSON in ${fileName}`);
  }

  const usernames = [];
  visitJson(data, usernames);
  return usernames;
}

function visitJson(value, usernames) {
  if (Array.isArray(value)) {
    for (const item of value) {
      visitJson(item, usernames);
    }

    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value.string_list_data)) {
    for (const item of value.string_list_data) {
      if (typeof item?.value === "string") {
        usernames.push(item.value);
      } else if (typeof item?.href === "string") {
        usernames.push(item.href);
      }
    }
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      visitJson(nested, usernames);
    }
  }
}

function extractUsersFromHtml(text) {
  const usernames = [];
  const instagramLinkPattern = /https?:\/\/(?:www\.)?instagram\.com\/([^/"'?#<\s]+)/gi;
  let match;

  while ((match = instagramLinkPattern.exec(text))) {
    usernames.push(match[1]);
  }

  return usernames;
}

function normalizeUsername(value) {
  const trimmed = String(value).trim();
  const urlMatch = trimmed.match(/instagram\.com\/([^/"'?#<\s]+)/i);
  const username = (urlMatch ? urlMatch[1] : trimmed).replace(/^@/, "").trim().toLowerCase();

  return /^[a-z0-9._]{1,30}$/.test(username) ? username : "";
}

#!/usr/bin/env node
// Fills in public/.well-known/assetlinks.json (Android App Links) and
// public/.well-known/apple-app-site-association (iOS Universal Links), so that
//   https://sdms-kh.web.app/auto-login#t=<token>
// opens the SDMS app directly when it is installed.
//
//   node scripts/set-app-links.js --team ABCDE12345
//   node scripts/set-app-links.js --team ABCDE12345 --sha256 AA:BB:...   (extra signing key, e.g. Play App Signing)
//
// Android: the release build is signed with the debug key for now, so by default the SHA-256 of
//   ~/.android/debug.keystore  is read with keytool. Pass --keystore <file> [--alias a --storepass p] to use another key.
// iOS: --team is the 10-character Apple Developer Team ID (developer.apple.com → Membership).
// Afterwards:  npm run build && firebase deploy --only hosting
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ANDROID_PACKAGE = "kh.gov.mef.sdms_app";
const IOS_BUNDLE = "kh.gov.mef.sdmsApp";

const args = process.argv.slice(2);
const opt = (name) => {
  const out = [];
  args.forEach((a, i) => {
    if (a === `--${name}` && args[i + 1]) out.push(args[i + 1]);
    else if (a.startsWith(`--${name}=`)) out.push(a.slice(name.length + 3));
  });
  return out;
};
const dir = path.join(__dirname, "..", "public", ".well-known");
fs.mkdirSync(dir, { recursive: true });

// ---------- Android ----------
const prints = opt("sha256").map((s) => s.trim().toUpperCase());
if (!prints.length) {
  const keystore = opt("keystore")[0] || path.join(os.homedir(), ".android", "debug.keystore");
  const alias = opt("alias")[0] || "androiddebugkey";
  const pass = opt("storepass")[0] || "android";
  try {
    const text = execFileSync("keytool", ["-list", "-v", "-keystore", keystore, "-alias", alias, "-storepass", pass], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const m = /SHA-?256:\s*([0-9A-Fa-f:]{95})/.exec(text);
    if (m) prints.push(m[1].toUpperCase());
  } catch (e) {
    console.error(`! keytool could not read ${keystore}: ${String(e.message).split("\n")[0]}`);
  }
}
if (prints.length) {
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: prints },
    },
  ];
  fs.writeFileSync(path.join(dir, "assetlinks.json"), JSON.stringify(assetlinks, null, 2) + "\n");
  console.log("Android assetlinks.json ←", prints.join(", "));
} else {
  console.error("! Android skipped: pass --sha256 AA:BB:... (cd sdms_app/android && ./gradlew signingReport)");
}

// ---------- iOS ----------
const team = (opt("team")[0] || "").toUpperCase();
if (/^[A-Z0-9]{10}$/.test(team)) {
  const aasa = {
    applinks: {
      details: [{ appIDs: [`${team}.${IOS_BUNDLE}`], components: [{ "/": "/auto-login*" }] }],
    },
  };
  fs.writeFileSync(path.join(dir, "apple-app-site-association"), JSON.stringify(aasa, null, 2) + "\n");
  console.log("iOS apple-app-site-association ←", `${team}.${IOS_BUNDLE}`);
} else {
  console.error("! iOS skipped: pass --team <10-character Apple Team ID>");
}
console.log("\nNext: npm run build && firebase deploy --only hosting");

import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

/**
 * Builds the "Sign in with Apple" client secret (a signed JWT) that Supabase
 * needs in Authentication > Providers > Apple > Secret Key. Apple limits it to
 * six months, so run this again before it expires.
 *
 *   pnpm --filter @fitty/web exec tsx scripts/apple-client-secret.ts \
 *     --team ABCDE12345 --key-id FGHIJ67890 --services-id uy.fitty.web --key-file ~/Downloads/AuthKey_FGHIJ67890.p8
 *
 * The private key stays on this machine; only the printed token goes into Supabase.
 */
const { values } = parseArgs({
  options: {
    team: { type: "string" },
    "key-id": { type: "string" },
    "services-id": { type: "string" },
    "key-file": { type: "string" },
  },
});
const { team, "key-id": keyId, "services-id": servicesId } = values;
const keyFile = values["key-file"];
if (!team || !keyId || !servicesId || !keyFile)
  throw new Error("Missing --team, --key-id, --services-id or --key-file");
const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const unsigned = `${encode({ alg: "ES256", kid: keyId, typ: "JWT" })}.${encode({
  iss: team,
  iat: now,
  exp: now + 180 * 24 * 60 * 60,
  aud: "https://appleid.apple.com",
  sub: servicesId,
})}`;
const signature = sign("sha256", Buffer.from(unsigned), {
  key: createPrivateKey(
    readFileSync(keyFile.replace(/^~/, process.env.HOME ?? "")),
  ),
  dsaEncoding: "ieee-p1363",
}).toString("base64url");
console.log(`${unsigned}.${signature}`);

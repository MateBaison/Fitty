#!/usr/bin/env node
// Encrypted backup of Fitty's database, kept on this Mac.
// How to use and restore it: docs/database-backup.md
import { spawnSync } from "node:child_process";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

const PROJECT = "pebgpdnaihnfjtbrjbto";
// Runs as a database user that can only read.
const ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT}/database/query/read-only`;
const FOLDER = path.join(os.homedir(), "Fitty-copias");
const KEEP_DAYS = 60;
const SCHEDULED_EVERY_DAYS = 6.5;
const SERVICE = "fitty-backup";
const AGENT = "uy.fitty.backup";
const MAGIC = Buffer.from("FITTYBK1");
const NAME = /^fitty-(\d{4}-\d\d-\d\d)T(\d\d)(\d\d)(\d\d)Z\.fittybackup$/;

// Restore order: accounts before the records that point to them.
const TABLES = [
  { name: "auth.users", generated: ["confirmed_at"] },
  { name: "auth.identities", generated: ["email"] },
  { name: 'public."Fitty_State"', generated: [] },
  { name: "public.account_activity", generated: [] },
];
const HISTORY = "supabase_migrations.schema_migrations";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function query(token, sql, fetcher) {
  const response = await fetcher(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(60_000),
  });
  if (response.status === 401 || response.status === 403)
    throw new Error(
      "Supabase rechazó la clave de acceso (venció o no tiene permiso de lectura de la base).",
    );
  if (!response.ok)
    throw new Error(`Supabase respondió con el error ${response.status}.`);
  const rows = await response.json();
  if (!Array.isArray(rows))
    throw new Error("Supabase devolvió una respuesta inesperada.");
  return rows;
}

async function readTable(token, table, fetcher) {
  const all = [];
  for (let offset = 0; ; offset += 500) {
    const page = await query(
      token,
      `select to_jsonb(t) as row from ${table} t order by 1 limit 500 offset ${offset}`,
      fetcher,
    );
    all.push(...page.map((item) => item.row));
    if (page.length < 500) return all;
  }
}

export async function collect(token, fetcher = fetch) {
  const tables = {};
  // Account data goes first, so every record already has its account below.
  // One account per request: each one can hold several photos.
  const owners = await query(
    token,
    'select user_id from public."Fitty_State" order by user_id',
    fetcher,
  );
  const state = [];
  for (const { user_id } of owners) {
    if (!UUID.test(user_id)) throw new Error("Identificador inesperado.");
    const found = await query(
      token,
      `select to_jsonb(t) as row from public."Fitty_State" t where t.user_id = '${user_id}'`,
      fetcher,
    );
    state.push(...found.map((item) => item.row));
  }
  tables['public."Fitty_State"'] = state;
  for (const table of [
    "public.account_activity",
    "auth.users",
    "auth.identities",
    HISTORY,
  ])
    tables[table] = await readTable(token, table, fetcher);
  if (!tables["auth.users"].length)
    throw new Error("La base devolvió cero cuentas; no se guardó la copia.");
  return {
    format: 1,
    project: PROJECT,
    takenAt: new Date().toISOString(),
    tables,
  };
}

function deriveKey(passphrase, salt) {
  return scryptSync(passphrase.normalize("NFC"), salt, 32, {
    N: 2 ** 15,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

export function encrypt(data, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  cipher.setAAD(MAGIC);
  const body = Buffer.concat([
    cipher.update(gzipSync(Buffer.from(JSON.stringify(data)))),
    cipher.final(),
  ]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
}

export function decrypt(file, passphrase) {
  if (file.length < 52 || !file.subarray(0, 8).equals(MAGIC))
    throw new Error("El archivo no es una copia de Fitty.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveKey(passphrase, file.subarray(8, 24)),
    file.subarray(24, 36),
  );
  decipher.setAAD(MAGIC);
  decipher.setAuthTag(file.subarray(36, 52));
  let plain;
  try {
    plain = Buffer.concat([
      decipher.update(file.subarray(52)),
      decipher.final(),
    ]);
  } catch {
    throw new Error("La contraseña no es correcta o el archivo está dañado.");
  }
  return JSON.parse(gunzipSync(plain).toString("utf8"));
}

function backups(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .flatMap((name) => {
      const match = NAME.exec(name);
      return match
        ? [
            {
              path: path.join(folder, name),
              time: Date.parse(
                `${match[1]}T${match[2]}:${match[3]}:${match[4]}Z`,
              ),
            },
          ]
        : [];
    })
    .sort((a, b) => b.time - a.time);
}

// Old copies are removed so that deleted accounts do not stay in them forever.
export function writeBackup(data, passphrase, folder, now = new Date()) {
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const stamp = now.toISOString().slice(0, 19).replaceAll(":", "");
  const target = path.join(folder, `fitty-${stamp}Z.fittybackup`);
  const partial = `${target}.part`;
  fs.writeFileSync(partial, encrypt(data, passphrase), { mode: 0o600 });
  // Read it back before trusting it and before removing anything older.
  decrypt(fs.readFileSync(partial), passphrase);
  fs.renameSync(partial, target);
  const limit = now.getTime() - KEEP_DAYS * 86_400_000;
  for (const old of backups(folder))
    if (old.time < limit && old.path !== target) fs.rmSync(old.path);
  return target;
}

function literal(value) {
  let tag;
  do tag = `$fitty_${randomBytes(4).toString("hex")}$`;
  while (value.includes(tag));
  return `${tag}${value}${tag}`;
}

// SQL for an empty project. Existing rows are never overwritten.
export function restoreSql(data) {
  const statements = TABLES.flatMap(({ name, generated }) => {
    const rows = data.tables[name] ?? [];
    if (!rows.length) return [];
    const columns = Object.keys(rows[0])
      .filter((column) => !generated.includes(column))
      .map((column) => `"${column.replaceAll('"', '""')}"`)
      .join(", ");
    return [
      `insert into ${name} (${columns})\nselect ${columns} from jsonb_populate_recordset(null::${name}, ${literal(JSON.stringify(rows))}::jsonb)\non conflict do nothing;`,
    ];
  });
  return `-- Copia del ${data.takenAt}\nbegin;\n\n${statements.join("\n\n")}\n\ncommit;\n`;
}

function readSecret(account) {
  const result = spawnSync(
    "/usr/bin/security",
    ["find-generic-password", "-s", SERVICE, "-a", account, "-w"],
    { encoding: "utf8" },
  );
  return result.status === 0
    ? Buffer.from(result.stdout.trim(), "base64").toString("utf8")
    : null;
}

function saveSecret(account, value) {
  // Sent through standard input so it never shows in the process list.
  const encoded = Buffer.from(value, "utf8").toString("base64");
  spawnSync("/usr/bin/security", ["-i"], {
    input: `add-generic-password -U -s ${SERVICE} -a ${account} -w ${encoded}\n`,
    stdio: ["pipe", "ignore", "inherit"],
  });
  if (readSecret(account) !== value)
    throw new Error("No se pudo guardar en el Llavero de macOS.");
}

function askHidden(question) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY)
    throw new Error(
      "Falta configurar: ejecutá el comando a mano en la Terminal.",
    );
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  return new Promise((resolve) => {
    let value = "";
    const read = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (char === "\r" || char === "\n") {
          stdin.off("data", read);
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write("\n");
          return resolve(value.trim());
        }
        if (char === "\u007f") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    stdin.on("data", read);
  });
}

async function accessToken() {
  const saved = readSecret("token");
  if (saved) return saved;
  console.log(
    "\n1) Clave de acceso de Supabase (solo la primera vez).\n   Creala en https://supabase.com/dashboard/account/tokens\n   con permiso de SOLO LECTURA de la base de datos y pegala acá.\n   No se ve mientras la pegás.",
  );
  const token = await askHidden("   Clave: ");
  if (!token || /\s/.test(token)) throw new Error("No se ingresó una clave.");
  await query(token, "select 1 as ok", fetch);
  saveSecret("token", token);
  return token;
}

async function passphrase() {
  const saved = readSecret("passphrase");
  if (saved) return saved;
  console.log(
    "\n2) Contraseña para cifrar las copias (solo la primera vez).\n   Elegí una de 12 caracteres o más y anotala fuera de esta Mac:\n   sin ella nadie puede abrir las copias, tampoco vos.",
  );
  const first = await askHidden("   Contraseña: ");
  if (first.length < 12)
    throw new Error("La contraseña necesita 12 caracteres o más.");
  if ((await askHidden("   Repetila: ")) !== first)
    throw new Error("Las contraseñas no coinciden.");
  saveSecret("passphrase", first);
  return first;
}

async function backup() {
  const token = await accessToken();
  const secret = await passphrase();
  console.log("\nCopiando la base de datos…");
  const data = await collect(token);
  const file = writeBackup(data, secret, FOLDER);
  console.log(
    `Copia guardada y verificada: ${file}\n  Cuentas: ${data.tables["auth.users"].length} · Datos de cuentas: ${data.tables['public."Fitty_State"'].length}`,
  );
}

async function openBackup(file) {
  const chosen = file ?? backups(FOLDER)[0]?.path;
  if (!chosen) throw new Error("Todavía no hay copias.");
  const secret =
    readSecret("passphrase") ?? (await askHidden("Contraseña de la copia: "));
  return { file: chosen, data: decrypt(fs.readFileSync(chosen), secret) };
}

function launchctl(...args) {
  return spawnSync("/bin/launchctl", args, { encoding: "utf8" });
}

const plistPath = () =>
  path.join(os.homedir(), "Library/LaunchAgents", `${AGENT}.plist`);

function scheduleWeekly() {
  // The scheduled task may not read folders such as Desktop, so it runs a copy.
  const support = path.join(os.homedir(), "Library/Application Support/Fitty");
  fs.mkdirSync(support, { recursive: true });
  const script = path.join(support, "backup-database.mjs");
  fs.copyFileSync(fileURLToPath(import.meta.url), script);
  const log = path.join(os.homedir(), "Library/Logs/fitty-backup.log");
  const xml = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const strings = [process.execPath, script, "--scheduled"]
    .map((value) => `<string>${xml(value)}</string>`)
    .join("");
  fs.mkdirSync(path.dirname(plistPath()), { recursive: true });
  fs.writeFileSync(
    plistPath(),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${AGENT}</string>
<key>ProgramArguments</key><array>${strings}</array>
<key>RunAtLoad</key><true/>
<key>StartCalendarInterval</key><dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>0</integer></dict>
<key>StandardOutPath</key><string>${xml(log)}</string>
<key>StandardErrorPath</key><string>${xml(log)}</string>
</dict></plist>
`,
  );
  const domain = `gui/${process.getuid()}`;
  launchctl("bootout", domain, plistPath());
  const loaded = launchctl("bootstrap", domain, plistPath());
  if (loaded.status !== 0)
    throw new Error(`No se pudo programar la copia: ${loaded.stderr.trim()}`);
  console.log(
    "\nListo: esta Mac hará una copia por semana. Para quitarlo: node scripts/backup-database.mjs --stop-weekly",
  );
}

function stopWeekly() {
  launchctl("bootout", `gui/${process.getuid()}`, plistPath());
  fs.rmSync(plistPath(), { force: true });
  console.log("Copia semanal desactivada. Las copias hechas no se borraron.");
}

async function main([option, argument]) {
  if (option === undefined) return backup();
  if (option === "--weekly") {
    await backup();
    return scheduleWeekly();
  }
  if (option === "--stop-weekly") return stopWeekly();
  if (option === "--scheduled") {
    const newest = backups(FOLDER)[0];
    if (newest && Date.now() - newest.time < SCHEDULED_EVERY_DAYS * 86_400_000)
      return;
    return backup();
  }
  if (option === "--check") {
    const { file, data } = await openBackup(argument);
    console.log(`${file}\nCopia del ${data.takenAt}. Registros:`);
    for (const [table, rows] of Object.entries(data.tables))
      console.log(`  ${table}: ${rows.length}`);
    return;
  }
  if (option === "--restore-sql") {
    const { file, data } = await openBackup(argument);
    const target = `${file}.restore.sql`;
    fs.writeFileSync(target, restoreSql(data), { mode: 0o600 });
    console.log(
      `Archivo creado: ${target}\nContiene datos privados SIN cifrar: borralo después de usarlo.`,
    );
    return;
  }
  throw new Error(
    "Opciones: (ninguna), --weekly, --stop-weekly, --check [archivo], --restore-sql [archivo]",
  );
}

if (
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main(process.argv.slice(2)).catch((error) => {
    console.error(`${new Date().toISOString()} Error: ${error.message}`);
    if (process.argv.includes("--scheduled"))
      spawnSync("/usr/bin/osascript", [
        "-e",
        'display notification "No se pudo hacer la copia de seguridad. Mirá ~/Library/Logs/fitty-backup.log" with title "Fitty"',
      ]);
    process.exitCode = 1;
  });

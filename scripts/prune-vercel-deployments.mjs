#!/usr/bin/env node
// Keeps the newest READY deployments of the Fitty project and deletes the rest,
// so the free plan's 10 GB of deployment storage never fills up.
//
//   VERCEL_TOKEN=... node scripts/prune-vercel-deployments.mjs          (dry run)
//   VERCEL_TOKEN=... node scripts/prune-vercel-deployments.mjs --apply  (delete)
//
// The token comes from the environment and is never written to disk or logged.
const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID ?? "prj_ZGR9OMxXGYrRzts1EAyxxtC6vuy5";
const teamId = process.env.VERCEL_TEAM_ID ?? "team_Zx2Ef4NbH2GJg8Y0SD1Ar5yB";
const keep = Number(process.env.KEEP_DEPLOYMENTS ?? 3);
const apply = process.argv.includes("--apply");
if (!token) {
  console.error("Falta VERCEL_TOKEN.");
  process.exit(1);
}
if (!Number.isInteger(keep) || keep < 1) {
  console.error("KEEP_DEPLOYMENTS debe ser un entero mayor o igual a 1.");
  process.exit(1);
}
const api = async (path, init) => {
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error(`${init?.method ?? "GET"} ${path.split("?")[0]} -> ${response.status}`);
  return response.json();
};

const all = [];
let until;
for (;;) {
  const page = await api(
    `/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=100${until ? `&until=${until}` : ""}`,
  );
  all.push(...page.deployments);
  if (!page.pagination?.next || page.deployments.length === 0) break;
  until = page.pagination.next;
}
all.sort((a, b) => b.created - a.created);

// Only finished deployments are candidates; builds in progress are never touched.
const finished = all.filter((d) => ["READY", "ERROR", "CANCELED"].includes(d.state));
const keepIds = new Set(
  finished.filter((d) => d.state === "READY").slice(0, keep).map((d) => d.uid ?? d.id),
);
const doomed = finished.filter((d) => !keepIds.has(d.uid ?? d.id));
console.log(
  `Despliegues: ${all.length} · se conservan ${keepIds.size} · se eliminan ${doomed.length}${apply ? "" : " (simulación, usá --apply para borrar)"}`,
);
let removed = 0;
for (const deployment of doomed) {
  const id = deployment.uid ?? deployment.id;
  const label = `${new Date(deployment.created).toISOString()} ${deployment.state} ${deployment.url ?? id}`;
  if (!apply) {
    console.log(`  - ${label}`);
    continue;
  }
  try {
    await api(`/v13/deployments/${id}?teamId=${teamId}`, { method: "DELETE" });
    removed += 1;
  } catch (error) {
    console.warn(`  ! No se pudo borrar ${label}: ${error.message}`);
  }
}
if (apply) console.log(`Eliminados: ${removed} de ${doomed.length}`);

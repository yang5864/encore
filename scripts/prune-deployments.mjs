/**
 * Vercel 배포 정리. 프로덕션 별칭이 붙은 배포와 최신 KEEP개는 남기고 나머지를 삭제한다.
 * 환경변수: VERCEL_TOKEN(필수), VERCEL_ORG_ID, VERCEL_PROJECT_ID, KEEP(기본 3), DRY_RUN=1이면 삭제하지 않는다.
 */
const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;
const keep = Math.max(1, Number(process.env.KEEP ?? 3));
const dryRun = process.env.DRY_RUN === "1";
if (!token || !teamId || !projectId) {
  console.error("VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID가 필요해요.");
  process.exit(1);
}

const api = async (path, init = {}) => {
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set("teamId", teamId);
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
  return res.json();
};

// 전체 배포 목록 (페이지네이션)
const all = [];
let until;
for (;;) {
  const q = new URLSearchParams({ projectId, limit: "100" });
  if (until) q.set("until", String(until));
  const { deployments, pagination } = await api(`/v6/deployments?${q}`);
  all.push(...deployments);
  if (!pagination?.next || deployments.length === 0) break;
  until = pagination.next;
}
all.sort((a, b) => b.created - a.created);

// 프로덕션 별칭이 붙은 배포는 지우지 않는다
const aliased = new Set();
try {
  const { aliases } = await api(`/v4/aliases?projectId=${projectId}&limit=100`);
  for (const a of aliases) if (a.deploymentId) aliased.add(a.deploymentId);
} catch (e) {
  console.warn("별칭 조회 실패, 최신 배포만 보호해요:", e.message);
}

const protectedIds = new Set([...aliased, ...all.slice(0, keep).map((d) => d.uid)]);
const victims = all.filter((d) => !protectedIds.has(d.uid));
console.log(`배포 ${all.length}개 · 보호 ${protectedIds.size}개(별칭 ${aliased.size} + 최신 ${keep}) · 삭제 대상 ${victims.length}개${dryRun ? " (DRY RUN)" : ""}`);

let removed = 0;
for (const d of victims) {
  const label = `${d.uid} ${d.url ?? ""} (${new Date(d.created).toISOString().slice(0, 10)})`;
  if (dryRun) { console.log("  skip", label); continue; }
  try {
    await api(`/v13/deployments/${d.uid}`, { method: "DELETE" });
    removed++;
    console.log("  deleted", label);
  } catch (e) {
    console.warn("  failed", label, e.message);
  }
}
console.log(`삭제 ${removed}개 완료`);

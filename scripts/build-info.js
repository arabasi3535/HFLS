/* 빌드 정보 생성 — npm run build / start / test 직전에 자동 실행
 * src/buildInfo.json 에 버전(package.json), 빌드 시각(KST), 커밋 해시를 기록합니다.
 * 커밋 해시: Vercel(VERCEL_GIT_COMMIT_SHA) → GitHub Actions(GITHUB_SHA) → 로컬 git → "local"
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function commit() {
  const env = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (env) return env.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "local";
  }
}

function kstNow() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

const where = process.env.VERCEL ? "vercel" : process.env.GITHUB_ACTIONS ? "github" : "local";
const info = { version: pkg.version, builtAt: kstNow(), commit: commit(), env: where };
fs.writeFileSync(path.join(root, "src", "buildInfo.json"), JSON.stringify(info, null, 2) + "\n");
console.log(`[build-info] v${info.version} · ${info.builtAt} KST · ${info.commit} (${where})`);

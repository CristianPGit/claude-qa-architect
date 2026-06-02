import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { listResults, DEFAULT_OUTPUT_DIR } from "./storage.js";
import type { DiffResult, VisualReport } from "./types.js";

export function generateHtmlReport(
  outputDir: string = DEFAULT_OUTPUT_DIR,
  reportPath?: string
): string {
  const results = listResults(outputDir);
  const path = reportPath ?? join(outputDir, "report.html");

  const report: VisualReport = {
    generatedAt: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.passed && !r.isNew).length,
      failed: results.filter((r) => !r.passed).length,
      newBaselines: results.filter((r) => r.isNew).length,
    },
  };

  const html = renderHtml(report);
  writeFileSync(path, html, "utf-8");
  return path;
}

function renderHtml(report: VisualReport): string {
  const { summary, results } = report;

  const cards = results.map(renderResultCard).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Visual Regression Report</title>
<style>
  :root {
    --bg: #0d1117;
    --card-bg: #161b22;
    --border: #30363d;
    --text: #c9d1d9;
    --muted: #8b949e;
    --green: #3fb950;
    --red: #f85149;
    --yellow: #d29922;
    --blue: #58a6ff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    line-height: 1.5;
  }
  header {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--card-bg);
  }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .subtitle { color: var(--muted); font-size: 14px; }
  .summary {
    display: flex;
    gap: 24px;
    margin-top: 16px;
  }
  .stat {
    padding: 12px 20px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    min-width: 100px;
  }
  .stat .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat .value { font-size: 24px; font-weight: 600; margin-top: 4px; }
  .stat.passed .value { color: var(--green); }
  .stat.failed .value { color: var(--red); }
  .stat.new .value { color: var(--blue); }
  main { padding: 24px 32px; }
  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  .card-header:hover { background: rgba(255,255,255,0.02); }
  .card-title { font-weight: 600; font-size: 16px; }
  .card-meta { color: var(--muted); font-size: 13px; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge.passed { background: rgba(63,185,80,0.15); color: var(--green); }
  .badge.failed { background: rgba(248,81,73,0.15); color: var(--red); }
  .badge.new { background: rgba(88,166,255,0.15); color: var(--blue); }
  .card-body { padding: 20px; display: none; }
  .card.expanded .card-body { display: block; }
  .images {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .img-col h3 {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .img-col img {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fff;
  }
  .stats-row {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: var(--muted);
  }
  .stats-row strong { color: var(--text); }
  .empty {
    text-align: center;
    padding: 80px;
    color: var(--muted);
  }
  .no-image {
    padding: 40px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    background: rgba(255,255,255,0.02);
    border: 1px dashed var(--border);
    border-radius: 4px;
  }
</style>
</head>
<body>
<header>
  <h1>Visual Regression Report</h1>
  <div class="subtitle">Generated ${new Date(report.generatedAt).toLocaleString()}</div>
  <div class="summary">
    <div class="stat"><div class="label">Total</div><div class="value">${summary.total}</div></div>
    <div class="stat passed"><div class="label">Passed</div><div class="value">${summary.passed}</div></div>
    <div class="stat failed"><div class="label">Failed</div><div class="value">${summary.failed}</div></div>
    <div class="stat new"><div class="label">New baselines</div><div class="value">${summary.newBaselines}</div></div>
  </div>
</header>
<main>
  ${results.length === 0
    ? '<div class="empty">No results yet. Run your tests with <code>visualCheck()</code> first.</div>'
    : cards}
</main>
<script>
  document.querySelectorAll(".card-header").forEach(h => {
    h.addEventListener("click", () => {
      h.parentElement.classList.toggle("expanded");
    });
  });
  document.querySelectorAll(".card.failed, .card.new").forEach(c => c.classList.add("expanded"));
</script>
</body>
</html>`;
}

function renderResultCard(result: DiffResult): string {
  const status = result.isNew ? "new" : result.passed ? "passed" : "failed";
  const statusLabel = result.isNew ? "NEW BASELINE" : result.passed ? "PASSED" : "FAILED";

  const baselineImg = embedImage(result.baselinePath);
  const currentImg = embedImage(result.currentPath);
  const diffImg = result.diffPath ? embedImage(result.diffPath) : null;

  return `
  <div class="card ${status}">
    <div class="card-header">
      <div>
        <div class="card-title">${escapeHtml(result.name)}</div>
        <div class="card-meta">
          ${escapeHtml(result.variant)} ·
          ${result.isNew ? "first snapshot" : `${result.diffPixels} px (${result.diffPercent}%)`}
        </div>
      </div>
      <div class="badge ${status}">${statusLabel}</div>
    </div>
    <div class="card-body">
      <div class="images">
        <div class="img-col">
          <h3>Baseline</h3>
          ${baselineImg ?? '<div class="no-image">No baseline</div>'}
        </div>
        <div class="img-col">
          <h3>Current</h3>
          ${currentImg ?? '<div class="no-image">No current</div>'}
        </div>
        <div class="img-col">
          <h3>Diff</h3>
          ${diffImg ?? '<div class="no-image">No diff (identical or new)</div>'}
        </div>
      </div>
      <div class="stats-row">
        <div>Pixels: <strong>${result.diffPixels.toLocaleString()}</strong> / ${result.totalPixels.toLocaleString()}</div>
        <div>Diff: <strong>${result.diffPercent}%</strong></div>
        ${result.failureReason ? `<div>Reason: <strong>${result.failureReason}</strong></div>` : ""}
      </div>
    </div>
  </div>`;
}

function embedImage(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    const buffer = readFileSync(path);
    const base64 = buffer.toString("base64");
    return `<img src="data:image/png;base64,${base64}" alt="">`;
  } catch {
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

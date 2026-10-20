import { grade } from "./graders.js";
import { createRunner } from "./targets.js";
import type { EvalFile, EvalReport, TaskStats, TrialResult } from "./types.js";

export async function runEval(
  evalFile: EvalFile,
  minPassRate: number,
  onTrial: (taskId: string, trial: number, pass: boolean) => void
): Promise<EvalReport> {
  const startedAt = new Date().toISOString();
  const runner = await createRunner(evalFile.target);
  const tasks: TaskStats[] = [];

  try {
    for (const task of evalFile.tasks) {
      const results: TrialResult[] = [];
      for (let trial = 1; trial <= evalFile.trials; trial++) {
        const transcript = await runner.run(task.input);
        const grades = transcript.error
          ? [{ grader: "llm-rubric" as const, pass: false, detail: `run failed: ${transcript.error}` }]
          : await Promise.all(task.graders.map((g) => grade(g, task, transcript, evalFile.judgeModel)));
        const pass = grades.every((g) => g.pass);
        results.push({ trial, pass, grades, transcript });
        onTrial(task.id, trial, pass);
      }
      tasks.push(summarize(task.id, results));
    }
  } finally {
    await runner.close();
  }

  const totalTrials = tasks.reduce((n, t) => n + t.trials, 0);
  const totalPasses = tasks.reduce((n, t) => n + t.passes, 0);

  return {
    name: evalFile.name,
    target: evalFile.target.type,
    startedAt,
    finishedAt: new Date().toISOString(),
    trials: evalFile.trials,
    minPassRate,
    tasks,
    summary: {
      tasks: tasks.length,
      reliable: tasks.filter((t) => t.passAllK).length,
      flaky: tasks.filter((t) => t.flaky).length,
      failing: tasks.filter((t) => t.passes === 0).length,
      passRate: totalTrials === 0 ? 0 : totalPasses / totalTrials,
    },
  };
}

function summarize(id: string, results: TrialResult[]): TaskStats {
  const passes = results.filter((r) => r.pass).length;
  const failingGraders: Record<string, number> = {};
  for (const r of results) {
    for (const g of r.grades) {
      if (!g.pass) failingGraders[g.grader] = (failingGraders[g.grader] ?? 0) + 1;
    }
  }
  const avg = (f: (r: TrialResult) => number) => Math.round(results.reduce((n, r) => n + f(r), 0) / results.length);

  return {
    id,
    trials: results.length,
    passes,
    passRate: passes / results.length,
    passAtK: passes > 0,
    passAllK: passes === results.length,
    flaky: passes > 0 && passes < results.length,
    avgLatencyMs: avg((r) => r.transcript.latencyMs),
    avgTokens: avg((r) => r.transcript.inputTokens + r.transcript.outputTokens),
    failingGraders,
    results,
  };
}

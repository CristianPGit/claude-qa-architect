import { execFileSync } from "node:child_process";

const git = (args: string[], cwd: string) =>
  execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();

export function repoRoot(cwd: string): string {
  return git(["rev-parse", "--show-toplevel"], cwd);
}

/**
 * Files changed on this branch relative to `base` (from their merge base, like a PR diff), plus
 * uncommitted and untracked files — what a local run needs to cover. Paths are repo-relative.
 */
export function changedFiles(base: string, cwd: string, includeWorkingTree: boolean): string[] {
  const mergeBase = git(["merge-base", base, "HEAD"], cwd);
  const lists = [git(["diff", "--name-only", `${mergeBase}...HEAD`], cwd)];
  if (includeWorkingTree) {
    lists.push(git(["diff", "--name-only", "HEAD"], cwd));
    lists.push(git(["ls-files", "--others", "--exclude-standard"], cwd));
  }
  return [...new Set(lists.flatMap((l) => l.split("\n")).filter(Boolean))].sort();
}

// A stand-in "agent" for trying agent-eval without credentials: it reads the task from stdin and
// answers correctly only half the time, so the report shows what a flaky task looks like.
import { readFileSync } from "node:fs";

const task = readFileSync(0, "utf-8").trim();
if (task.includes("capital of Austria")) {
  console.log(Math.random() < 0.5 ? "The capital of Austria is Vienna." : "I think it is Salzburg.");
} else if (task.includes("2 + 2")) {
  console.log("2 + 2 = 4");
} else {
  console.log("I don't know.");
}

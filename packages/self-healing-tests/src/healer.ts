import { chromium, type Page, type ElementHandle } from "playwright";
import type { SelectorFailure, HealCandidate, HealResult, HealStrategy } from "./types.js";

export async function healFailures(
  failures: SelectorFailure[],
  baseUrl?: string
): Promise<HealResult[]> {
  if (failures.length === 0) return [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results: HealResult[] = [];

  try {
    const page = await context.newPage();

    const byPage = groupByUrl(failures, baseUrl);

    for (const [url, group] of byPage) {
      if (url) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.waitForTimeout(2000);
        } catch {
          for (const failure of group) {
            results.push({ failure, candidates: [], chosen: null, patched: false, verified: false });
          }
          continue;
        }
      }

      for (const failure of group) {
        const candidates = await findCandidates(page, failure);
        const chosen = candidates.length > 0 ? candidates[0] : null;
        results.push({ failure, candidates, chosen, patched: false, verified: false });
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

function groupByUrl(
  failures: SelectorFailure[],
  baseUrl?: string
): Map<string, SelectorFailure[]> {
  const map = new Map<string, SelectorFailure[]>();

  for (const f of failures) {
    const url = f.pageUrl || baseUrl || "";
    const group = map.get(url) ?? [];
    group.push(f);
    map.set(url, group);
  }

  return map;
}

async function findCandidates(
  page: Page,
  failure: SelectorFailure
): Promise<HealCandidate[]> {
  const candidates: HealCandidate[] = [];

  const selectorHints = extractHints(failure.selector);

  if (selectorHints.text) {
    await tryTextMatch(page, selectorHints.text, candidates);
  }

  if (selectorHints.role) {
    await tryRoleMatch(page, selectorHints.role, selectorHints.name, candidates);
  }

  if (selectorHints.testId) {
    await tryTestIdMatch(page, selectorHints.testId, candidates);
  }

  if (selectorHints.placeholder) {
    await tryPlaceholderMatch(page, selectorHints.placeholder, candidates);
  }

  if (selectorHints.ariaLabel) {
    await tryAriaLabelMatch(page, selectorHints.ariaLabel, candidates);
  }

  if (selectorHints.id) {
    await tryIdMatch(page, selectorHints.id, candidates);
  }

  if (selectorHints.classFragments.length > 0) {
    await tryClassFuzzyMatch(page, selectorHints.classFragments, candidates);
  }

  if (selectorHints.tag) {
    await tryStructuralMatch(page, selectorHints, candidates);
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates.slice(0, 5);
}

interface SelectorHints {
  text: string;
  role: string;
  name: string;
  testId: string;
  placeholder: string;
  ariaLabel: string;
  id: string;
  tag: string;
  classFragments: string[];
  rawSelector: string;
}

function extractHints(selector: string): SelectorHints {
  const hints: SelectorHints = {
    text: "",
    role: "",
    name: "",
    testId: "",
    placeholder: "",
    ariaLabel: "",
    id: "",
    tag: "",
    classFragments: [],
    rawSelector: selector,
  };

  const textMatch = selector.match(/text=['"]?([^'">\]]+)/i);
  if (textMatch) hints.text = textMatch[1].trim();

  const roleMatch = selector.match(/role=(\w+)/i);
  if (roleMatch) hints.role = roleMatch[1];

  const nameMatch = selector.match(/\[name=['"]?([^'">\]]+)/i);
  if (nameMatch) hints.name = nameMatch[1];

  const testIdMatch = selector.match(/data-testid=['"]?([^'">\]]+)/i);
  if (testIdMatch) hints.testId = testIdMatch[1];

  const placeholderMatch = selector.match(/placeholder=['"]?([^'">\]]+)/i);
  if (placeholderMatch) hints.placeholder = placeholderMatch[1];

  const ariaMatch = selector.match(/aria-label=['"]?([^'">\]]+)/i);
  if (ariaMatch) hints.ariaLabel = ariaMatch[1];

  const idMatch = selector.match(/#([\w-]+)/);
  if (idMatch) hints.id = idMatch[1];

  const tagMatch = selector.match(/^(\w+)/);
  if (tagMatch && !tagMatch[1].includes(".") && !tagMatch[1].includes("#")) {
    hints.tag = tagMatch[1];
  }

  const classMatches = selector.match(/\.([\w-]+)/g);
  if (classMatches) {
    hints.classFragments = classMatches.map((c) => c.slice(1));
  }

  const hashClassMatch = selector.match(/([\w]+)--[\w]{6,}/);
  if (hashClassMatch) {
    hints.classFragments.push(hashClassMatch[1]);
  }

  return hints;
}

async function tryTextMatch(
  page: Page,
  text: string,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const elements = await page.getByText(text, { exact: false }).elementHandles();
    for (const el of elements.slice(0, 3)) {
      const info = await getElementInfo(el);
      if (!info) continue;
      candidates.push({
        selector: `getByText('${text}')`,
        strategy: "text-match",
        confidence: 0.8,
        element: info,
      });
    }
  } catch { /* no match */ }
}

async function tryRoleMatch(
  page: Page,
  role: string,
  name: string,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const locator = name
      ? page.getByRole(role as Parameters<Page["getByRole"]>[0], { name })
      : page.getByRole(role as Parameters<Page["getByRole"]>[0]);

    const elements = await locator.elementHandles();
    for (const el of elements.slice(0, 3)) {
      const info = await getElementInfo(el);
      if (!info) continue;
      const selectorStr = name
        ? `getByRole('${role}', { name: '${name}' })`
        : `getByRole('${role}')`;
      candidates.push({
        selector: selectorStr,
        strategy: "role-match",
        confidence: 0.9,
        element: info,
      });
    }
  } catch { /* no match */ }
}

async function tryTestIdMatch(
  page: Page,
  testId: string,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const elements = await page.getByTestId(testId).elementHandles();
    for (const el of elements.slice(0, 3)) {
      const info = await getElementInfo(el);
      if (!info) continue;
      candidates.push({
        selector: `getByTestId('${testId}')`,
        strategy: "testid-match",
        confidence: 0.95,
        element: info,
      });
    }
  } catch { /* no match */ }
}

async function tryPlaceholderMatch(
  page: Page,
  placeholder: string,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const elements = await page.getByPlaceholder(placeholder, { exact: false }).elementHandles();
    for (const el of elements.slice(0, 3)) {
      const info = await getElementInfo(el);
      if (!info) continue;
      candidates.push({
        selector: `getByPlaceholder('${placeholder}')`,
        strategy: "placeholder-match",
        confidence: 0.85,
        element: info,
      });
    }
  } catch { /* no match */ }
}

async function tryAriaLabelMatch(
  page: Page,
  ariaLabel: string,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const elements = await page.getByLabel(ariaLabel, { exact: false }).elementHandles();
    for (const el of elements.slice(0, 3)) {
      const info = await getElementInfo(el);
      if (!info) continue;
      candidates.push({
        selector: `getByLabel('${ariaLabel}')`,
        strategy: "aria-label-match",
        confidence: 0.85,
        element: info,
      });
    }
  } catch { /* no match */ }
}

async function tryIdMatch(
  page: Page,
  id: string,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const el = await page.$(`#${id}`);
    if (!el) return;
    const info = await getElementInfo(el);
    if (!info) return;
    candidates.push({
      selector: `locator('#${id}')`,
      strategy: "id-match",
      confidence: 0.9,
      element: info,
    });
  } catch { /* no match */ }
}

async function tryClassFuzzyMatch(
  page: Page,
  classFragments: string[],
  candidates: HealCandidate[]
): Promise<void> {
  for (const fragment of classFragments) {
    try {
      const elements = await page.$$(`[class*="${fragment}"]`);
      for (const el of elements.slice(0, 3)) {
        const info = await getElementInfo(el);
        if (!info) continue;

        const stableSelector = await buildStableSelector(el, info);
        candidates.push({
          selector: stableSelector,
          strategy: "class-fuzzy-match",
          confidence: 0.6,
          element: info,
        });
      }
    } catch { /* no match */ }
  }
}

async function tryStructuralMatch(
  page: Page,
  hints: SelectorHints,
  candidates: HealCandidate[]
): Promise<void> {
  try {
    const elements = await page.$$(hints.tag);
    for (const el of elements.slice(0, 10)) {
      const info = await getElementInfo(el);
      if (!info) continue;

      let score = 0.3;
      if (hints.text && info.text.includes(hints.text)) score += 0.3;
      if (hints.id && info.attributes["id"] === hints.id) score += 0.3;

      if (score > 0.3) {
        const stableSelector = await buildStableSelector(el, info);
        candidates.push({
          selector: stableSelector,
          strategy: "structural-match",
          confidence: Math.min(score, 0.7),
          element: info,
        });
      }
    }
  } catch { /* no match */ }
}

async function getElementInfo(
  el: ElementHandle
): Promise<{ tag: string; text: string; attributes: Record<string, string> } | null> {
  try {
    return await el.evaluate((node) => {
      const htmlEl = node as HTMLElement;
      const attrs: Record<string, string> = {};
      for (const attr of htmlEl.attributes) {
        attrs[attr.name] = attr.value;
      }
      return {
        tag: htmlEl.tagName.toLowerCase(),
        text: (htmlEl.textContent ?? "").trim().slice(0, 100),
        attributes: attrs,
      };
    });
  } catch {
    return null;
  }
}

async function buildStableSelector(
  el: ElementHandle,
  info: { tag: string; text: string; attributes: Record<string, string> }
): Promise<string> {
  if (info.attributes["data-testid"]) {
    return `getByTestId('${info.attributes["data-testid"]}')`;
  }

  if (info.attributes["aria-label"]) {
    return `getByLabel('${info.attributes["aria-label"]}')`;
  }

  if (info.attributes["placeholder"]) {
    return `getByPlaceholder('${info.attributes["placeholder"]}')`;
  }

  const role = await el.evaluate((node) => (node as HTMLElement).getAttribute("role"));
  if (role && info.text) {
    return `getByRole('${role}', { name: '${info.text.slice(0, 50)}' })`;
  }

  if (info.text && info.text.length > 2 && info.text.length < 80) {
    return `getByText('${info.text}')`;
  }

  if (info.attributes["id"]) {
    return `locator('#${info.attributes["id"]}')`;
  }

  const className = info.attributes["class"] ?? "";
  const stableClass = className
    .split(/\s+/)
    .find((c) => c.length > 2 && !c.includes("--") && !/[A-Z]{5,}/.test(c));

  if (stableClass) {
    return `locator('.${stableClass}')`;
  }

  return `locator('${info.tag}')`;
}

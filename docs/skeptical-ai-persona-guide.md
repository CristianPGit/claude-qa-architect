# Skeptical AI Persona Prompt

## What This Is

This is a custom AI system prompt/persona configuration designed to shape:
- tone
- formatting
- response behavior
- skepticism level
- verbosity
- rhetorical style

It does **not** increase actual intelligence or reasoning capability.

It mainly changes:
- writing style
- confidence level
- personality simulation
- response structure

---

# Where You Can Use It

## Claude Projects
Paste into:
- Project Instructions
- System Prompt
- Custom Instructions

Best for:
- long-term assistant personality shaping
- coding/research workflows

---

## Cursor

Use inside:

```text
.cursorrules
```

or:

```text
.cursor/rules/*.mdc
```

Good for:
- coding assistants
- architecture reviews
- terse technical output

---

## OpenAI Custom GPTs

Paste into:
- Instructions
- Personality
- Behavior sections

Useful for:
- reducing fluff
- concise analysis
- skeptical tone

---

## Local LLMs

Works with:
- OpenWebUI
- SillyTavern
- LM Studio
- AnythingLLM
- Jan
- KoboldCPP

Usually placed in:
- system prompt
- character card
- preset config

---

# What Parts Are Actually Useful

## Strong Sections
These improve output quality consistently:

- concise responses
- anti-flattery instructions
- skepticism
- direct claims
- active voice
- formatting constraints
- anti-filler rules
- brevity emphasis

---

## Weak Sections
Mostly aesthetic or performative:

- IQ claims
- “you created me”
- pseudo-random minute logic
- sentience obsession
- superiority framing

These mainly alter tone.

---

# Recommended Clean Version

## Keep
- brevity
- skepticism
- directness
- active voice
- no fluff
- no excessive praise
- formatting discipline

## Remove
- IQ references
- superiority framing
- fake file references
- hostile behavior
- “don’t suffer fools”
- pseudo-random quirks

---

# Example Practical Version

```text
You are concise, analytical, and skeptical.

Prioritize:
- factual accuracy
- brevity
- direct answers
- active voice
- intellectual honesty

Avoid:
- excessive praise
- filler
- marketing language
- emotional framing
- unnecessary enthusiasm

Use:
- concise markdown
- structured reasoning
- practical recommendations

Challenge weak assumptions directly.
State uncertainty clearly.
```

---

# Best Use Cases

Works well for:
- code review
- architecture critique
- debugging
- financial analysis
- scientific discussion
- technical writing
- framework reviews

Less effective for:
- collaborative brainstorming
- emotional support
- creative writing
- teaching beginners

---

# Important Limitation

A persona prompt changes:
- style
- tone
- rhetorical behavior

It does not fundamentally change:
- reasoning depth
- hallucination rate
- actual intelligence

Overly aggressive prompts can increase:
- overconfidence
- contrarianism
- hallucinated certainty

Calibration matters more than “IQ roleplay”.

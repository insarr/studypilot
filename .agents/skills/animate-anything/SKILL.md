---
name: animate-anything
description: "Motion and animation synthesis patterns inspired by wjlgatech/animate-anything: fine-grained motion control, region-specific animation, and dynamic visual motion effects for UI illustrations and images."
---

# animate-anything (wjlgatech/animate-anything)

Motion and animation synthesis patterns inspired by wjlgatech/animate-anything: fine-grained motion control, region-specific animation, and dynamic visual motion effects for UI illustrations and images.

Source repository: https://github.com/wjlgatech/animate-anything

See `references/README.md` for the full upstream reference and catalog.

## Key Excerpt

# 🎬 Animate Anything

<div align="center">

[![Awesome](https://awesome.re/badge-flat2.svg)](https://awesome.re)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Last Updated](https://img.shields.io/github/last-commit/wjlgatech/animate-anything?style=flat-square&label=last%20updated)](https://github.com/wjlgatech/animate-anything/commits/main)
[![Stars](https://img.shields.io/github/stars/wjlgatech/animate-anything?style=flat-square)](https://github.com/wjlgatech/animate-anything)
[![Pages](https://img.shields.io/badge/interactive%20map-live-8b5cf6?style=flat-square)](https://wjlgatech.github.io/animate-anything/)

**The comprehensive, ranked, living map of animation — from a CSS keyframe to an AI-authored launch video.**

*One place to **learn** motion, hand your **agents** a machine-readable registry to build with, and a **community** that keeps it fresh.*

[Learn](#-learn--the-map) • [Ranked Tables](#-the-registry-ranked) • [Tooling for Agents](#-tooling--for-agents) • [Roadmaps](#-learning-roadmaps) • [Community](#-community--contribute) • [Interactive Map](https://wjlgatech.github.io/animate-anything/)

</div>

---

> **⚡ Three folds, one repo** (modeled on [`rsi`](https://github.com/wjlgatech/awesome-auto-ai-research) and [`FDE-os`](https://github.com/wjlgatech/FDE-os)):
> 1. **📚 Learn** — a taxonomy of *what animates what*, every tool ranked (not just listed), with beginner→pro roadmaps and "when to reach for which."
> 2. **🤖 Tooling for agents** — the whole list compiles to a machine-readable [`knowledge/graph.json`](knowledge/graph.json) + [`llms.txt`](llms.txt), so an agent can *query* the landscape and pick the right library for a task. Pairs with [`anyagent skills`](#-tooling--for-agents).
> 3. **🌍 Community** — Awesome-list convention, PRs welcome, and a **weekly freshness check** (GitHub Action) that probes every link and files an issue when one dies. Editing the README is all a contributor ever does — the graph and map recompile themselves.

---

## 🕸️ Living Knowledge Graph

This list **compiles**. Every tool below is a node in a typed graph (`part_of` a category, `has_code` its repo), so you can *explore* it, not just scroll it:

- **🗺️ [Explore the interactive map](https://wjlgatech.github.io/animate-anything/)** — force-layout graph with search + type filters + click-to-inspect (self-contained HTML; also open [`docs/index.html`](docs/index.html) locally).
- **🧩 [`knowledge/graph.json`](knowledge/graph.json)** — the full machine-readable graph for your own agents, RAG pipelines, or analysis.
- **🤖 [`llms.txt`](llms.txt)** — a flat, agent-friendly index of every tool + its one-line use-case + license + observed agentic surface.
- **🛠️ [`knowledge/agentic.json`](knowledge/agentic.json)** — which 🥇 repos *actually ship* agent tooling (AGENTS.md · CLAUDE.md · skills · Claude/Codex/Cursor plugins · MCP config · llms.txt), probed weekly from the repos themselves ([workflow](.github/workflows/agentic.yml)) — evidence, never reputation.

**It stays alive automatically.** On every README merge, [a GitHub Action](.github/workflows/knowledge.yml) recompiles the graph + map + `llms.txt` (all three are compiled — only the README is hand-edited); [a weekly freshness check](.github/workflows/freshness.yml) probes every link and opens an issue if any die; and [`make check`](Makefile) gates every PR (linter goldens + graph integrity).

---

## 🧭 Learn — the map

Animation isn't one thing — it's a stack of *materials* and the *runtimes* that move them. This taxonomy is the mental model the whole registry hangs on:

| Layer | What moves | Reach for it when… | Examples |
|---|---|---|---|
| **CSS / declarative** | DOM elements via keyframes/transitions | micro-interactions, cheap & offline, no JS | Animate.css, Tailwind, hand-rolled CSS |
| **JS timeline / tween** | anything, on a scriptable timeline | orchestrated sequences, scroll-driven, SVG | GSAP, Motion, Anime.js |
| **UI-framework motion** | React/Vue component state | app UIs, gestures, layout transitions | Motion (Framer), React Spring, AutoAnimate |
| **Vector runtime** | designer-authored vector art | icon/illustration motion shipped from design tools | Lottie, Rive |
| **3D / WebGL / shader** | meshes, particles, fragment shaders | immersive scenes, generative/ambient motion | Three.js, R3F, PixiJS, Babylon.js |
| **Video-as-code** | a composition rendered to frames | reproducible MP4s, launch videos, data-driven video | Remotion, Motion Canvas, HeyGen Hyperframes |
| **AI / agent-authored** | a prompt or a reference → a composition | agents generating motion from intent | Hyperframes, the `/watch` workflow, generative video |

**The craft that spans all layers** (from Emil Kowalski's animation review + Apple's fluid-interface talks): enter animations **ease-out, never ease-in**; UI transitions **under ~300ms**, a button press **100–160ms**; **no animation on high-frequency actions** — spend motion where it's rare and meaningful; and always honor **`prefers-reduced-motion`**. A tool doesn't make motion good; these rules do.

---

## 📊 How we rank

Every tool carries a **tier** (🥇 best-in-class · 🥈 solid · 🥉 niche/fading) computed from six criteria — so the list is *opinionated*, not a flat dump:

| Criterion | Why it matters |
|---|---|
| **Adoption** | stars + npm/CDN usage — social proof it's battle-tested |
| **Performance** | jank-free at 60fps; GPU-friendly; bundle weight |
| **Learning curve** | time-to-first-animation vs ceiling |
| **License openness** | MIT/Apache (build freely) vs commercial/gated |
| **Agent-authorability** | can an LLM write it reliably from a prompt? (declarative, well-documented, deterministic) |
| **Maintenance health** | recent commits, releases, issue responsiveness |

Popularity is *one* input, never the whole verdict — a well-maintained MIT library an agent can author beats a flashier gated one for this
---
name: lenis
description: "Smooth inertial scrolling, scroll-linked animations, and GSAP ScrollTrigger synchronization using darkroomengineering/lenis in React and TypeScript."
---

# Lenis — Smooth Scroll Skill

Guide for integrating smooth inertial scrolling with `lenis` (`lenis` / `lenis/react`) and synchronizing it with GSAP `ScrollTrigger` and Motion.

## Core Best Practices

1. **Initialization & Cleanup**:
   - Instantiate `const lenis = new Lenis({ duration: 1.1, smoothWheel: true })` inside `useEffect` (or use `autoRaf: true`).
   - Always call `lenis.destroy()` on unmount.
   - Never hijack native scroll inside inner scrollable containers (`overflow-y: auto` modals, chat boxes, or code blocks) — add `data-lenis-prevent` to inner scrollable elements.
2. **GSAP ScrollTrigger Sync**:
   - Connect Lenis to GSAP with:
     ```ts
     lenis.on('scroll', ScrollTrigger.update);
     gsap.ticker.add((time) => lenis.raf(time * 1000));
     gsap.ticker.lagSmoothing(0);
     ```
3. **Accessibility**:
   - Disable smooth scroll when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true.

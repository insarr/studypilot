---
name: lottie-web
description: "Render and control vector animations exported from After Effects / Lottie JSON using airbnb/lottie-web in React and TypeScript."
---

# Lottie-Web — Vector Animation Skill

Guide for embedding and controlling lightweight vector animations with `lottie-web` (`lottie.loadAnimation`).

## Core Best Practices

1. **Mounting & Cleanup**:
   - Load animations in `useEffect` with `const anim = lottie.loadAnimation({ container, renderer: 'svg', loop, autoplay, animationData })`.
   - Always call `anim.destroy()` in the `useEffect` cleanup function to prevent duplicate SVGs in React StrictMode.
2. **Performance & Accessibility**:
   - Prefer `renderer: 'svg'` for crisp scaling and small animations, or `renderer: 'canvas'` for particle-heavy scenes.
   - Respect `prefers-reduced-motion: reduce` by setting `autoplay: false` or jumping to a representative frame with `anim.goToAndStop(frame, true)`.

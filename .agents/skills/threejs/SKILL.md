---
name: threejs
description: "3D WebGL / WebGPU graphics, scenes, cameras, lighting, shaders, and interactive 3D elements with Three.js (mrdoob/three.js) in React and TypeScript."
---

# Three.js — 3D Web Graphics Skill

Guide for building performant, responsive, and accessible 3D WebGL scenes using `three` in React + TypeScript applications.

## Core Best Practices

1. **Lifecycle & Memory Management**:
   - Always dispose of geometries (`geometry.dispose()`), materials (`material.dispose()`), textures (`texture.dispose()`), and the renderer (`renderer.dispose()`) inside the React `useEffect` cleanup function.
   - Cancel the `requestAnimationFrame` loop on unmount.
2. **Performance & Pixel Ratio**:
   - Cap device pixel ratio with `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to prevent GPU overload on high-DPI mobile/Retina screens.
   - Use `alpha: true` and `antialias: true` on `THREE.WebGLRenderer` when overlaying 3D objects on UI backgrounds.
3. **Accessibility**:
   - Respect `window.matchMedia('(prefers-reduced-motion: reduce)')` by pausing continuous rotation/floating loops or reducing motion speed.
   - Mark decorative 3D canvases with `aria-hidden="true"` and `pointer-events: none` unless directly interactive.

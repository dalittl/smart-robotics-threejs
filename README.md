# Smart Robotics — three.js + React (Vite)

A small starter project demonstrating a simple "smart robot" scene implemented with react, three.js and @react-three/fiber. Includes a movable arm, animated idle motion, and a small HUD.

## Features

- Vite + React (18)
- three.js scene via @react-three/fiber
- @react-three/drei helpers (OrbitControls, Gizmo, Stats)
- Leva UI for live tuning
- Lightweight robot model composed of primitives

## Setup (Windows PowerShell)

1. Install dependencies

```powershell
cd "d:\littl\SOFTWARE PROJECTS\smart-robotics-threejs"
npm install
```

2. Start dev server

```powershell
npm run dev
```

3. Open the URL printed by Vite (usually http://localhost:5173)

## Notes
- This project is intentionally small. Replace the primitive robot model with GLTF/GLB models for production.
- To build a production bundle run `npm run build` and `npm run preview` to preview the built app.

## Useful links
- three.js: https://threejs.org/
- react-three-fiber docs: https://docs.pmnd.rs/react-three-fiber/
- drei helpers: https://github.com/pmndrs/drei

Quick run / smoke test

PowerShell commands to run the app locally:

```powershell
cd "d:\littl\SOFTWARE PROJECTS\smart-robotics-threejs"
npm install
npm run dev
```

Smoke test checklist:
- Dev server starts without errors.
- Open http://localhost:5173 (or the URL printed by Vite).
- You should see a dark gradient background and a 3D robot in the center.
- Orbit with mouse drag, zoom with scroll. Leva panel on the screen lets you tweak parameters.
- Stats panel shows FPS in the top-left.

If you hit dependency issues on older Node/npm, consider upgrading Node to 18+ and npm to latest.

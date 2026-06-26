// =========================================================
// APOLLO EVE — Hero 3D scene
// Two bodies. One orbit. A binary system built for the dark.
// =========================================================
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const PALETTE = {
  void: 0x050810,
  orbit: 0x4a9eff,
  ion: 0xffffff,
  glow: 0x7bb8ff,
  pulse: 0x00e0d4,
};

export function initHeroScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(PALETTE.void, 0.012);

  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 0, 16);

  // ---- Lighting ----
  scene.add(new THREE.AmbientLight(0x223047, 0.6));
  const key = new THREE.PointLight(PALETTE.orbit, 80, 60);
  key.position.set(6, 4, 8);
  scene.add(key);
  const rim = new THREE.PointLight(PALETTE.glow, 40, 60);
  rim.position.set(-8, -3, 4);
  scene.add(rim);

  // ---- Binary system group ----
  const system = new THREE.Group();
  system.rotation.x = 0.5;
  system.rotation.z = -0.18;
  scene.add(system);

  // Apollo — the larger ion-white body
  const apollo = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 64, 64),
    new THREE.MeshStandardMaterial({
      color: PALETTE.ion,
      emissive: 0x6e86b0,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.1,
    })
  );
  system.add(apollo);

  // Eve — the smaller companion orb (white)
  const eve = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 48, 48),
    new THREE.MeshStandardMaterial({
      color: PALETTE.ion,
      emissive: PALETTE.ion,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.2,
    })
  );
  const eveLight = new THREE.PointLight(PALETTE.ion, 24, 30);
  eve.add(eveLight);
  system.add(eve);

  // Orbit rings (the binary paths)
  const ringMat = new THREE.MeshBasicMaterial({
    color: PALETTE.orbit,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
  });
  const ringMatFaint = new THREE.MeshBasicMaterial({
    color: PALETTE.glow,
    transparent: true,
    opacity: 0.07,
    side: THREE.DoubleSide,
  });
  const orbitRadius = 5.4;
  const ring1 = new THREE.Mesh(new THREE.RingGeometry(orbitRadius - 0.015, orbitRadius + 0.015, 200), ringMat);
  ring1.rotation.x = Math.PI / 2;
  system.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.RingGeometry(7.6 - 0.01, 7.6 + 0.01, 200), ringMatFaint);
  ring2.rotation.x = Math.PI / 2;
  ring2.rotation.z = 0.4;
  system.add(ring2);

  const ring3 = new THREE.Mesh(new THREE.RingGeometry(3.4 - 0.01, 3.4 + 0.01, 160), ringMatFaint);
  ring3.rotation.x = Math.PI / 2.3;
  ring3.rotation.y = 0.5;
  system.add(ring3);

  // A drifting moon on the outer ring
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 24),
    new THREE.MeshStandardMaterial({ color: PALETTE.ion, emissive: PALETTE.ion, emissiveIntensity: 1.2 })
  );
  system.add(moon);

  // ---- Starfield ----
  const starGeo = new THREE.BufferGeometry();
  const STAR_COUNT = 1400;
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = Math.random() * 1.4 + 0.2;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const starMat = new THREE.PointsMaterial({
    color: 0x9fb6d8,
    size: 0.16,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- Dust particles near the system ----
  const dustGeo = new THREE.BufferGeometry();
  const DUST = 500;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const r = 6 + Math.random() * 10;
    const a = Math.random() * Math.PI * 2;
    dpos[i * 3] = Math.cos(a) * r;
    dpos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    dpos[i * 3 + 2] = Math.sin(a) * r;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: PALETTE.orbit,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(dust);

  // ---- Post-processing (bloom) ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.6, // strength
    0.6, // radius
    0.25 // threshold
  );
  composer.addPass(bloom);

  // ---- Interaction state ----
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollProgress = 0;
  let sectionFocus = 0; // 0 hero .. 1 deep

  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function setScroll(p) {
    scrollProgress = p;
  }
  function setFocus(f) {
    sectionFocus = f;
  }

  // ---- Resize ----
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // ---- Animation loop ----
  const clock = new THREE.Clock();
  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Binary orbit
    const speed = 0.5;
    eve.position.set(Math.cos(t * speed) * orbitRadius, 0, Math.sin(t * speed) * orbitRadius);
    apollo.position.set(
      Math.cos(t * speed + Math.PI) * 1.1,
      0,
      Math.sin(t * speed + Math.PI) * 1.1
    );
    moon.position.set(Math.cos(-t * 0.32) * 7.6, Math.sin(-t * 0.32) * 7.6 * Math.sin(0.4), Math.sin(-t * 0.32) * 7.6 * Math.cos(0.4));

    eve.material.emissiveIntensity = 1.3 + Math.sin(t * 2.0) * 0.3;

    // Central planet slowly transitions black -> white -> black
    const v = Math.sin(t * 0.4) * 0.5 + 0.5;
    apollo.material.color.setRGB(v, v, v);
    apollo.material.emissive.setRGB(v, v, v);
    apollo.material.emissiveIntensity = v * 0.8;
    key.color.setRGB(0.55 + v * 0.45, 0.62 + v * 0.38, 1.0);

    // System slow tumble + scroll-driven rotation
    system.rotation.y = t * 0.08 + scrollProgress * Math.PI * 1.2;
    system.rotation.x = 0.5 + Math.sin(t * 0.15) * 0.05 + scrollProgress * 0.4;

    stars.rotation.y = t * 0.005;
    dust.rotation.y = -t * 0.02;

    // Camera dolly on scroll: pull back + drift
    const targetZ = 16 + scrollProgress * 10;
    camera.position.z += (targetZ - camera.position.z) * 0.05;

    // Parallax
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * 1.6 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    composer.render();
  }
  animate();

  return {
    setScroll,
    setFocus,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    },
  };
}

// =========================================================
// APOLLO EVE — Eve character mini-scene (#001)
// A small idle robot bust inside the character bible card.
// =========================================================
import * as THREE from "three";

export function initEveScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function size() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.4, 6);

  scene.add(new THREE.AmbientLight(0x2a3650, 0.8));
  const key = new THREE.PointLight(0x4a9eff, 30, 20);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x7bb8ff, 18, 20);
  rim.position.set(-4, 1, 2);
  scene.add(rim);

  const eve = new THREE.Group();
  scene.add(eve);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f1c,
    roughness: 0.4,
    metalness: 0.6,
    emissive: 0x0a1424,
    emissiveIntensity: 0.4,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x4a9eff,
    emissive: 0x4a9eff,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });

  // Cube body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 2.0), bodyMat);
  body.position.y = -1.1;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.35 })
  );
  body.add(edges);
  eve.add(body);

  // Accent strip on body
  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.12, 2.02), accentMat);
  strip.position.y = -0.6;
  eve.add(strip);

  // Head (winged)
  const head = new THREE.Group();
  head.position.y = 0.7;
  eve.add(head);

  const headCore = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.3), bodyMat);
  head.add(headCore);

  // Eye
  const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 8, 16), accentMat);
  eye.rotation.z = Math.PI / 2;
  eye.position.set(0, 0.05, 0.68);
  head.add(eye);

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.9, 0.5, 0.08);
  const wingL = new THREE.Mesh(wingGeo, bodyMat);
  wingL.position.set(-1.0, 0.2, -0.2);
  wingL.rotation.z = 0.5;
  head.add(wingL);
  const wingR = wingL.clone();
  wingR.position.x = 1.0;
  wingR.rotation.z = -0.5;
  head.add(wingR);

  // Orbiting accent dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), accentMat);
  scene.add(dot);

  size();
  window.addEventListener("resize", size);

  // gentle pointer follow
  let px = 0, py = 0, tx = 0, ty = 0;
  canvas.parentElement.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 1.4;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 1.0;
  });
  canvas.parentElement.addEventListener("pointerleave", () => { tx = 0; ty = 0; });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;

    eve.rotation.y = px * 0.8 + Math.sin(t * 0.3) * 0.15;
    eve.rotation.x = py * 0.4;
    eve.position.y = Math.sin(t * 1.2) * 0.08;

    eye.material.emissiveIntensity = 1.4 + Math.sin(t * 3) * 0.4;
    dot.position.set(Math.cos(t * 1.5) * 2.6, 0.4 + Math.sin(t * 2) * 0.3, Math.sin(t * 1.5) * 1.5);

    renderer.render(scene, camera);
  }
  animate();
}

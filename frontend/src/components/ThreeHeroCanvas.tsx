import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroCanvas({ className = '', height = 420 }: { className?: string; height?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.z = 9.5;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff3e7, 1.6);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    // Craft Docs Pastel Materials
    const matMint = new THREE.MeshStandardMaterial({ color: 0x9bd8a9, roughness: 0.35, metalness: 0.08 });
    const matMarigold = new THREE.MeshStandardMaterial({ color: 0xfde99b, roughness: 0.32, metalness: 0.08 });
    const matPeriwinkle = new THREE.MeshStandardMaterial({ color: 0xb8caf5, roughness: 0.35, metalness: 0.1 });
    const matPapaya = new THREE.MeshStandardMaterial({ color: 0xff591c, roughness: 0.3, metalness: 0.12 });

    // Academic geometric polyhedra (Platonic solids & knowledge rings)
    const geoIco = new THREE.IcosahedronGeometry(0.75, 0);
    const meshIco = new THREE.Mesh(geoIco, matMint);
    meshIco.position.set(-4.4, 1.4, -1.2);
    scene.add(meshIco);

    const geoOct = new THREE.OctahedronGeometry(0.68, 0);
    const meshOct = new THREE.Mesh(geoOct, matMarigold);
    meshOct.position.set(4.5, 1.7, -1.0);
    scene.add(meshOct);

    const geoTorus = new THREE.TorusGeometry(0.58, 0.2, 18, 42);
    const meshTorus = new THREE.Mesh(geoTorus, matPeriwinkle);
    meshTorus.position.set(-4.1, -1.8, -0.8);
    scene.add(meshTorus);

    const geoDodeca = new THREE.DodecahedronGeometry(0.58, 0);
    const meshDodeca = new THREE.Mesh(geoDodeca, matPapaya);
    meshDodeca.position.set(4.3, -1.6, -1.4);
    scene.add(meshDodeca);

    let mouseX = 0;
    let mouseY = 0;
    const onMove = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 800;
      const nh = container.clientHeight || height;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize, { passive: true });

    let rafId = 0;
    let t = 0;
    const renderLoop = () => {
      t += 0.012;
      if (!reduced) {
        meshIco.rotation.x = t * 0.7;
        meshIco.rotation.y = t * 0.9;
        meshIco.position.y = 1.4 + Math.sin(t * 1.4) * 0.25;

        meshOct.rotation.x = -t * 0.6;
        meshOct.rotation.z = t * 0.8;
        meshOct.position.y = 1.7 + Math.cos(t * 1.3) * 0.24;

        meshTorus.rotation.x = t * 0.85;
        meshTorus.rotation.y = -t * 0.65;
        meshTorus.position.y = -1.8 + Math.sin(t * 1.2 + 1) * 0.22;

        meshDodeca.rotation.y = t * 0.75;
        meshDodeca.rotation.z = -t * 0.55;
        meshDodeca.position.y = -1.6 + Math.cos(t * 1.5 + 2) * 0.22;

        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
      if (!reduced) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      geoIco.dispose();
      geoOct.dispose();
      geoTorus.dispose();
      geoDodeca.dispose();
      matMint.dispose();
      matMarigold.dispose();
      matPeriwinkle.dispose();
      matPapaya.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [height]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    />
  );
}

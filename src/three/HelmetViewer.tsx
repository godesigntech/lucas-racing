/* Live 3D helmet viewer (Three.js). Concept geometry, procedural materials. */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { HelmetDesign } from '@/core/types';
import { paintHelmet, preloadDesignImages } from '@/core/helmetPaint';
import { modelById } from '@/data/helmets';
import { UV_H, UV_W } from '@/core/uv';
import { rimCurve, shellGeometry, spoilerGeometry, surfacePoint, visorGeometry } from './helmetGeometry';

export type ViewName = 'front' | 'side' | 'rear' | 'top' | 'three-quarter' | 'right';

export interface HelmetViewerApi {
  setView(v: ViewName, animate?: boolean): void;
  reset(): void;
  /** PNG data URL of the current render (optionally from a given view). */
  snapshot(opts?: { view?: ViewName; width?: number; height?: number }): Promise<string>;
}

interface Props {
  design: HelmetDesign;
  autoRotate?: boolean;
  /** Paint a watermark onto the shell texture (shares, exports). */
  watermark?: string | null;
  className?: string;
  interactive?: boolean;
  initialView?: ViewName;
  onReady?: () => void;
}

const VIEWS: Record<ViewName, [number, number, number]> = {
  front: [4.2, 0.35, 0],
  side: [0, 0.35, 4.2],
  right: [0, 0.35, -4.2],
  rear: [-4.2, 0.45, 0],
  top: [0.4, 4.3, 0.01],
  'three-quarter': [2.7, 1.1, 3.1],
};

export const HelmetViewer = forwardRef<HelmetViewerApi, Props>(function HelmetViewer(
  { design, autoRotate = false, watermark = null, className, interactive = true, initialView = 'three-quarter', onReady }, ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const S = useRef<{
    renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls;
    shell: THREE.Mesh; visor: THREE.Mesh; rim: THREE.Mesh; spoiler: THREE.Mesh; plastics: THREE.Group;
    colorTex: THREE.CanvasTexture; pbrTex: THREE.CanvasTexture; shellMat: THREE.MeshPhysicalMaterial;
    anim: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null; modelId: string; raf: number; dirty: boolean;
  } | null>(null);
  const [webgl, setWebgl] = useState(true);

  // ---------- init once ----------
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      setWebgl(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(...VIEWS[initialView]);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.3;
    controls.maxDistance = 7.5;
    controls.enablePan = false;
    controls.target.set(0, 0.05, 0);
    controls.autoRotateSpeed = 1.6;
    controls.enabled = interactive;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 4);
    scene.add(key, new THREE.HemisphereLight(0xffffff, 0x404040, 0.5));
    const rimL = new THREE.DirectionalLight(0xc8f031, 0.35);
    rimL.position.set(-4, 2, -3);
    scene.add(rimL);

    // Soft floor shadow
    const sh = document.createElement('canvas');
    sh.width = sh.height = 128;
    const sc = sh.getContext('2d')!;
    const grd = sc.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,.45)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    sc.fillStyle = grd;
    sc.fillRect(0, 0, 128, 128);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    scene.add(floor);

    const blank = () => { const c = document.createElement('canvas'); c.width = UV_W; c.height = UV_H; return c; };
    const colorTex = new THREE.CanvasTexture(blank());
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pbrTex = new THREE.CanvasTexture(blank());
    const shellMat = new THREE.MeshPhysicalMaterial({
      map: colorTex, roughnessMap: pbrTex, metalnessMap: pbrTex, roughness: 1, metalness: 1,
      clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1,
    });
    const shell = new THREE.Mesh(new THREE.BufferGeometry(), shellMat);
    const visor = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhysicalMaterial({
      color: 0x18202c, transparent: true, opacity: 0.62, roughness: 0.04, metalness: 0.3, clearcoat: 1, side: THREE.DoubleSide,
    }));
    const rim = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x121412, roughness: 0.75 }));
    const spoiler = new THREE.Mesh(spoilerGeometry(), new THREE.MeshPhysicalMaterial({ color: 0x121412, roughness: 0.3, clearcoat: 0.6 }));
    const plastics = new THREE.Group();
    scene.add(shell, visor, rim, spoiler, plastics);

    S.current = { renderer, scene, camera, controls, shell, visor, rim, spoiler, plastics, colorTex, pbrTex, shellMat, anim: null, modelId: '', raf: 0, dirty: true };

    const resize = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const tick = () => {
      const s = S.current!;
      if (s.anim) {
        s.anim.t = Math.min(1, s.anim.t + 0.06);
        const e = 1 - Math.pow(1 - s.anim.t, 3);
        camera.position.lerpVectors(s.anim.from, s.anim.to, e);
        if (s.anim.t >= 1) s.anim = null;
      }
      controls.update();
      renderer.render(scene, camera);
      s.raf = requestAnimationFrame(tick);
    };
    tick();
    onReady?.();

    return () => {
      cancelAnimationFrame(S.current?.raf || 0);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      pmrem.dispose();
      el.removeChild(renderer.domElement);
      S.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (S.current) S.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  // ---------- design → scene ----------
  useEffect(() => {
    const s = S.current;
    if (!s) return;
    let cancelled = false;
    const apply = () => {
      if (cancelled || !S.current) return;
      const model = modelById(design.modelId);
      if (s.modelId !== model.id) {
        s.modelId = model.id;
        s.shell.geometry.dispose();
        s.shell.geometry = shellGeometry(model.shape);
        s.visor.geometry.dispose();
        s.visor.geometry = visorGeometry(model.shape);
        s.rim.geometry.dispose();
        s.rim.geometry = new THREE.TubeGeometry(rimCurve(model.shape), 200, 0.035, 10, true);
        // Spoiler placement on the rear crown
        const sp = surfacePoint(0, 0.3, model.shape, 0.01);
        s.spoiler.position.copy(sp.pos);
        s.spoiler.lookAt(sp.pos.clone().add(new THREE.Vector3(0, 0, 1)));
        s.spoiler.rotation.set(0, 0, Math.atan2(sp.normal.y, sp.normal.x) - Math.PI / 2 - 0.15);
        // Plastics: chin vent, crown vents, visor pivots
        s.plastics.clear();
        const mat = new THREE.MeshPhysicalMaterial({ color: 0x121412, roughness: 0.35, clearcoat: 0.5 });
        const add = (geo: THREE.BufferGeometry, u: number, v: number, lift = 0.012) => {
          const p = surfacePoint(u, v, model.shape, lift);
          const m = new THREE.Mesh(geo, mat);
          m.position.copy(p.pos);
          m.lookAt(p.pos.clone().add(p.normal));
          s.plastics.add(m);
        };
        add(new THREE.BoxGeometry(0.34, 0.12, 0.04), 0.5, 0.86);
        add(new THREE.BoxGeometry(0.1, 0.22, 0.035), 0.47, 0.18);
        add(new THREE.BoxGeometry(0.1, 0.22, 0.035), 0.53, 0.18);
        add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32).rotateX(Math.PI / 2), 0.385, 0.6, 0.02);
        add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32).rotateX(Math.PI / 2), 0.615, 0.6, 0.02);
      }
      const { color, pbr } = paintHelmet(design, { watermark });
      s.colorTex.image = color;
      s.colorTex.needsUpdate = true;
      s.pbrTex.image = pbr;
      s.pbrTex.needsUpdate = true;
      s.shellMat.clearcoat = design.finish === 'satin' ? 0.15 : 1;
      s.shellMat.clearcoatRoughness = design.finish === 'satin' ? 0.5 : 0.05;
      (s.rim.material as THREE.MeshStandardMaterial).color.set(design.trims.baseRubber);
      s.plastics.children.forEach((c) => ((c as THREE.Mesh).material as THREE.MeshPhysicalMaterial).color.set(design.trims.plastic));
      s.spoiler.visible = design.spoiler.enabled && model.spoilerCompatible;
      (s.spoiler.material as THREE.MeshPhysicalMaterial).color.set(design.spoiler.color);
    };
    apply();
    // Re-apply once uploaded images have loaded.
    preloadDesignImages(design).then(apply);
    return () => { cancelled = true; };
  }, [design, watermark]);

  useImperativeHandle(ref, () => ({
    setView(v, animate = true) {
      const s = S.current;
      if (!s) return;
      const to = new THREE.Vector3(...VIEWS[v]);
      if (animate) s.anim = { from: s.camera.position.clone(), to, t: 0 };
      else { s.camera.position.copy(to); s.controls.update(); }
    },
    reset() {
      const s = S.current;
      if (!s) return;
      s.anim = { from: s.camera.position.clone(), to: new THREE.Vector3(...VIEWS['three-quarter']), t: 0 };
    },
    async snapshot(opts = {}) {
      const s = S.current;
      if (!s) return '';
      await preloadDesignImages(design);
      const prev = s.camera.position.clone();
      const prevAspect = s.camera.aspect;
      const size = new THREE.Vector2();
      s.renderer.getSize(size);
      const w = opts.width ?? size.x, h = opts.height ?? size.y;
      if (opts.view) s.camera.position.set(...VIEWS[opts.view]);
      s.renderer.setSize(w, h, false);
      s.camera.aspect = w / h;
      s.camera.updateProjectionMatrix();
      s.camera.lookAt(s.controls.target);
      s.renderer.render(s.scene, s.camera);
      const url = s.renderer.domElement.toDataURL('image/png');
      s.renderer.setSize(size.x, size.y, false);
      s.camera.aspect = prevAspect;
      s.camera.updateProjectionMatrix();
      s.camera.position.copy(prev);
      s.controls.update();
      return url;
    },
  }), [design]);

  return (
    <div ref={host} className={'helmet-viewer ' + (className || '')}>
      {!webgl && <div className="viewer-fallback">3D preview needs WebGL, which isn't available in this browser.</div>}
    </div>
  );
});

/* CONCEPT helmet geometry built from a deformed sphere.
   Not manufacturer-accurate: replace with scanned/modelled GLB assets per model. */
import * as THREE from 'three';
import type { HelmetModel } from '@/core/types';
import { EYE, UV_H, UV_W } from '@/core/uv';

export const THETA_LEN = Math.PI * 0.8; // shell stops above the neck opening

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Deform a unit-sphere point (y up, face towards +X). */
export function deform(p: THREE.Vector3, shape: HelmetModel['shape'], out = new THREE.Vector3()): THREE.Vector3 {
  let { x, y, z } = p;
  // Overall proportions
  x *= shape.length;
  y *= shape.height;
  z *= 0.93;
  // Chin bar: push the lower front forward and down
  const front = smooth(0.0, 0.8, p.x);
  const low = smooth(0.05, -0.75, p.y);
  x += shape.chin * front * low * 0.9;
  y -= shape.chin * front * low * 0.25;
  // Narrow the chin slightly
  z *= 1 - 0.12 * front * low;
  // Rear tail flare at the bottom back
  const back = smooth(-0.1, -0.9, p.x);
  x -= shape.tail * back * low * 0.6;
  // Flatten the bottom
  if (y < -0.7) y = -0.7 + (y + 0.7) * 0.6;
  return out.set(x, y + 0.1, z);
}

export function shellGeometry(shape: HelmetModel['shape']): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 180, 110, 0, Math.PI * 2, 0, THETA_LEN);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    deform(v, shape, v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Point on the shell surface for UV (u around from rear, v top→rim). */
export function surfacePoint(u: number, v: number, shape: HelmetModel['shape'], lift = 0): { pos: THREE.Vector3; normal: THREE.Vector3 } {
  const at = (uu: number, vv: number) => {
    const phi = uu * Math.PI * 2, theta = vv * THETA_LEN;
    // Same parametrisation as THREE.SphereGeometry
    const p = new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
    return deform(p, shape);
  };
  const p = at(u, v);
  const du = at(u + 0.002, v).sub(at(u - 0.002, v));
  const dv = at(u, v + 0.002).sub(at(u, v - 0.002));
  const n = new THREE.Vector3().crossVectors(dv, du).normalize();
  if (n.dot(p) < 0) n.negate();
  return { pos: p.add(n.clone().multiplyScalar(lift)), normal: n };
}

export function visorGeometry(shape: HelmetModel['shape']): THREE.BufferGeometry {
  const pad = 0.018;
  const phiStart = (EYE.x0 / UV_W - pad) * Math.PI * 2;
  const phiLen = ((EYE.x1 - EYE.x0) / UV_W + pad * 2) * Math.PI * 2;
  const thStart = (EYE.y0 / UV_H - 0.05) * THETA_LEN;
  const thLen = ((EYE.y1 - EYE.y0) / UV_H + 0.09) * THETA_LEN;
  const g = new THREE.SphereGeometry(1, 64, 32, phiStart, phiLen, thStart, thLen);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    deform(v, shape, v);
    v.multiplyScalar(1.022);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function rimCurve(shape: HelmetModel['shape']): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 96; i++) pts.push(surfacePoint(i / 96, 0.995, shape).pos);
  return new THREE.CatmullRomCurve3(pts, true);
}

/** Rear spoiler: a swept wing lip sitting on the back of the crown. */
export function spoilerGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.12, 0.03, -0.28, 0.07, -0.42, 0.06);
  s.lineTo(-0.44, 0.02);
  s.bezierCurveTo(-0.3, 0.0, -0.14, -0.05, 0.02, -0.09);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.62, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -0.31);
  return g;
}

"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial
} from "three";

const COUNT = 16000;

type SceneTuning = {
  trenchWidth: number;
  wallSpeed: number;
  boostLength: number;
  boostSpread: number;
  boostLag: number;
  directionY: number;
};

const DEFAULT_TUNING: SceneTuning = {
  trenchWidth: 0.84,
  wallSpeed: 0.86,
  boostLength: 0.52,
  boostSpread: 0.3,
  boostLag: 0.22,
  directionY: -0.78
};

function seeded(index: number) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getSceneScale(aspect: number, trenchWidth = 1) {
  const mobile = aspect < 0.75;
  return {
    railX: (mobile ? 1.25 : Math.min(3.45, 2.05 + aspect * 0.8)) * trenchWidth,
    steerX: (mobile ? 1.05 : Math.min(4.35, 2.35 + aspect * 1.15)) * trenchWidth,
    wallDepth: mobile ? 0.9 : 1.35,
    wallHeight: mobile ? 2.35 : 3.0
  };
}

function usePageScroll() {
  const progress = useRef(0);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.current = Math.min(1, Math.max(0, window.scrollY / max));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}

function useGlobalPointer() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const update = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("pointerdown", update, { passive: true });
    return () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerdown", update);
    };
  }, []);

  return pointer;
}

function makePlanetPoint(i: number) {
  const r1 = seeded(i);
  const r2 = seeded(i + 99);
  const r3 = seeded(i + 199);
  const section = seeded(i + 299);

  if (section < 0.34) {
    const angle = r1 * Math.PI * 2;
    const radius = 1.88 + r2 * 0.72;
    return [Math.cos(angle) * radius, (r3 - 0.5) * 0.16, Math.sin(angle) * radius * 0.34];
  }

  const theta = Math.acos(1 - 2 * r1);
  const phi = Math.PI * 2 * r2;
  const radius = 0.86 + r3 * 0.07;

  return [
    Math.sin(theta) * Math.cos(phi) * radius,
    Math.cos(theta) * radius,
    Math.sin(theta) * Math.sin(phi) * radius * 0.82
  ];
}

function makeExplodePoint(i: number) {
  const u = seeded(i + 400);
  const v = seeded(i + 500);
  const radius = 2.1 + seeded(i + 600) * 4.8;
  const theta = Math.acos(1 - 2 * u);
  const phi = Math.PI * 2 * v;
  return [
    Math.sin(theta) * Math.cos(phi) * radius,
    Math.cos(theta) * radius * 0.72,
    Math.sin(theta) * Math.sin(phi) * radius
  ];
}

function makeShipPoint(i: number) {
  const r1 = seeded(i + 700);
  const r2 = seeded(i + 800);
  const r3 = seeded(i + 900);
  const section = seeded(i + 1000);

  // Rear-view fighter: a compact engine, tapered fuselage, delta wings, and twin tail fins.
  if (section < 0.09) {
    const angle = r1 * Math.PI * 2;
    const radius = 0.08 + Math.sqrt(r2) * 0.18;
    return [Math.cos(angle) * radius * 1.12, -0.16 + Math.sin(angle) * radius * 0.76, 0.92 + (r3 - 0.5) * 0.08];
  }

  if (section < 0.63) {
    const t = r1;
    const z = 0.82 - t * 2.72;
    const width = 0.12 + Math.sin(t * Math.PI) * 0.2 + (1 - t) * 0.06;
    const height = 0.1 + Math.sin(t * Math.PI) * 0.12;
    return [(r2 - 0.5) * width * 2, -0.1 + (r3 - 0.5) * height, z];
  }

  if (section < 0.88) {
    const side = r1 > 0.5 ? 1 : -1;
    const t = r2;
    const z = 0.42 - t * 1.52;
    const root = 0.14 + (1 - t) * 0.12;
    const span = 0.22 + (1 - t) * 0.58;
    return [side * (root + r3 * span), -0.18 - r3 * 0.1 + t * 0.07, z];
  }

  if (section < 0.96) {
    const side = r1 > 0.5 ? 1 : -1;
    return [side * (0.16 + r2 * 0.22), 0.02 + r3 * 0.36, 0.48 - r2 * 0.76];
  }

  if (section < 0.99) {
    return [(r2 - 0.5) * 0.18, 0.04 + r3 * 0.13, -0.48 - r1 * 0.92];
  }

  const angle = r1 * Math.PI * 2;
  const radius = r2 * 0.07;
  return [Math.cos(angle) * radius, -0.08 + Math.sin(angle) * radius * 0.55, -1.94 - r3 * 0.18];
}

function ParticleSculpture({ tuning, hyperdrive }: { tuning: SceneTuning; hyperdrive: boolean }) {
  const progressRef = usePageScroll();
  const globalPointer = useGlobalPointer();
  const { size } = useThree();
  const pointsRef = useRef<Points>(null);
  const matRef = useRef<PointsMaterial>(null);
  const hyperStart = useRef<number | null>(null);

  const data = useMemo(() => {
    const planet = new Float32Array(COUNT * 3);
    const explode = new Float32Array(COUNT * 3);
    const ship = new Float32Array(COUNT * 3);
    const color = new Float32Array(COUNT * 3);
    const geometry = new BufferGeometry();

    const blue = new Color("#9fd8ff");
    const white = new Color("#ffffff");
    const amber = new Color("#ffd184");

    for (let i = 0; i < COUNT; i += 1) {
      const index = i * 3;
      planet.set(makePlanetPoint(i), index);
      explode.set(makeExplodePoint(i), index);
      ship.set(makeShipPoint(i), index);

      const tone = seeded(i + 1200);
      const shipSection = seeded(i + 1000);
      const c =
        shipSection < 0.09
          ? tone < 0.18
            ? new Color("#ff4f57")
            : amber
          : shipSection > 0.96 && shipSection < 0.99
            ? blue
            : tone < 0.16
              ? blue
              : tone < 0.22
                ? amber
                : white;
      color[index] = c.r;
      color[index + 1] = c.g;
      color[index + 2] = c.b;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(planet.slice(), 3));
    geometry.setAttribute("color", new Float32BufferAttribute(color, 3));
    return { geometry, planet, explode, ship };
  }, []);

  useFrame(({ clock, pointer, camera }) => {
    const progress = progressRef.current;
    if (hyperdrive && hyperStart.current === null) hyperStart.current = clock.elapsedTime;
    if (!hyperdrive) hyperStart.current = null;
    const hyperTime = hyperStart.current === null ? 0 : clock.elapsedTime - hyperStart.current;
    const hyperLaunch = ease(clamp01(hyperTime / 2.85));
    const hyperFade = ease(clamp01((hyperTime - 2.55) / 0.72));
    const attr = data.geometry.getAttribute("position") as Float32BufferAttribute;
    const positions = attr.array as Float32Array;
    const explodeBase = clamp01((progress - 0.12) / 0.32);
    const shipBase = clamp01((progress - 0.38) / 0.28);
    const assembly = ease(clamp01((progress - 0.62) / 0.13));
    const interactive = ease(clamp01((progress - 0.78) / 0.14));
    const steerX = globalPointer.current.x;
    const bounds = getSceneScale(size.width / Math.max(1, size.height), tuning.trenchWidth);

    for (let i = 0; i < COUNT; i += 1) {
      const index = i * 3;
      const delay = (seeded(i + 2800) - 0.5) * 0.18;
      const wave = Math.sin(clock.elapsedTime * 1.4 + i * 0.035 + progress * 8) * 0.055;
      const explodeT = ease(clamp01(explodeBase + delay + wave));
      const shipT = ease(clamp01(shipBase + delay * 0.7 - wave * 0.45));
      let x = mix(data.planet[index], data.explode[index], explodeT);
      let y = mix(data.planet[index + 1], data.explode[index + 1], explodeT);
      let z = mix(data.planet[index + 2], data.explode[index + 2], explodeT);

      x = mix(x, data.ship[index], shipT);
      y = mix(y, data.ship[index + 1], shipT);
      z = mix(z, data.ship[index + 2], shipT);

      const idleA = Math.sin(clock.elapsedTime * 0.72 + i * 0.017);
      const idleB = Math.cos(clock.elapsedTime * 0.54 + i * 0.023);
      const idleC = Math.sin(clock.elapsedTime * 0.43 + i * 0.031);
      const flow = Math.max(0.006, 0.026 + explodeT * 0.052 - shipT * 0.068);
      x += idleA * flow;
      y += idleB * flow;
      z += idleC * flow * 1.4;

      const near = Math.max(0, 1 - Math.hypot(x - pointer.x * 3.6, y - pointer.y * 2.2) / 2.4);
      const pull = near * interactive;
      x += steerX * (interactive * 0.25 + pull * 0.08);
      y += pointer.y * (interactive * 0.08 + pull * 0.06);
      z += Math.sin(clock.elapsedTime * 2 + i * 0.01) * interactive * near * 0.42;

      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
    }

    attr.needsUpdate = true;

    if (pointsRef.current) {
      const globalShip = ease(clamp01(shipBase));
      pointsRef.current.rotation.y = mix(-0.18 + progress * 0.35, -0.03, interactive);
      pointsRef.current.rotation.x = mix(assembly * Math.PI * 0.5, 0, interactive);
      pointsRef.current.rotation.z = 0;
      const directionY = mix(0.18 - globalShip * 0.28, tuning.directionY, assembly);
      pointsRef.current.position.y = mix(directionY, -1.45, interactive);
      pointsRef.current.position.x = steerX * interactive * bounds.steerX;
      pointsRef.current.position.z = -hyperLaunch * 18;
      pointsRef.current.scale.setScalar(1 - hyperLaunch * 0.84);
    }

    if (matRef.current) {
      matRef.current.size = (0.015 + progress * 0.015 + interactive * 0.005) * (1 - hyperLaunch * 0.38);
      matRef.current.opacity = (0.66 + progress * 0.24) * (1 - hyperFade);
    }

    const intro = ease(clamp01(clock.elapsedTime / 3.2));
    const hyperShake = hyperLaunch * (1 - hyperFade);
    camera.position.x += (mix(-0.92, 0, intro) + Math.sin(clock.elapsedTime * 28) * hyperShake * 0.025 - camera.position.x) * 0.024;
    camera.position.z += (mix(8.25, 7.1 - progress * 1.45, intro) - camera.position.z) * 0.025;
    camera.position.y += (mix(0.36, -0.08 - interactive * 0.45, intro) + Math.cos(clock.elapsedTime * 23) * hyperShake * 0.02 - camera.position.y) * 0.02;
    const targetFov = mix(43, 68, hyperLaunch * (1 - hyperFade));
    const perspectiveCamera = camera as PerspectiveCamera;
    if (Math.abs(perspectiveCamera.fov - targetFov) > 0.01) {
      perspectiveCamera.fov += (targetFov - perspectiveCamera.fov) * 0.08;
      perspectiveCamera.updateProjectionMatrix();
    }
    camera.lookAt(mix(0.52, 0, intro), mix(0.1, -0.62, intro), -0.4);
  });

  return (
    <points ref={pointsRef} geometry={data.geometry}>
      <pointsMaterial
        ref={matRef}
        vertexColors
        transparent
        opacity={0.78}
        size={0.022}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function ParticleGlow() {
  const progressRef = usePageScroll();
  const ref = useRef<Points>(null);
  const matRef = useRef<PointsMaterial>(null);
  const data = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const geometry = new BufferGeometry();
    const cyan = new Color("#69f0ff");
    const violet = new Color("#9d7cff");
    const amber = new Color("#ffd184");

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      const sourceIndex = Math.floor(seeded(i + 3100) * COUNT);
      positions.set(makeExplodePoint(sourceIndex), index);
      const color = seeded(i + 3200) < 0.65 ? cyan : seeded(i + 3300) < 0.75 ? amber : violet;
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return { geometry };
  }, []);

  useFrame(({ clock }) => {
    const progress = progressRef.current;
    const appear = ease(clamp01((progress - 0.2) / 0.26));
    const clear = ease(clamp01((progress - 0.5) / 0.18));
    const trench = ease(clamp01((progress - 0.82) / 0.12));
    const active = Math.max(appear * (1 - clear), trench);
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.025 + progress * 0.6;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.04;
      ref.current.visible = active > 0.02;
    }
    if (matRef.current) {
      matRef.current.opacity = appear * (1 - clear) * 0.15 + trench * 0.19;
      matRef.current.size = 0.09 + progress * 0.025 + trench * 0.07;
    }
  });

  return (
    <points ref={ref} geometry={data.geometry}>
      <pointsMaterial
        ref={matRef}
        vertexColors
        transparent
        opacity={0}
        size={0.1}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function TunnelField({ tuning }: { tuning: SceneTuning }) {
  const progressRef = usePageScroll();
  const { size } = useThree();
  const ref = useRef<Points>(null);
  const glowRef = useRef<Points>(null);
  const matRef = useRef<PointsMaterial>(null);
  const glowMatRef = useRef<PointsMaterial>(null);
  const data = useMemo(() => {
    const count = 14400;
    const rows = 72;
    const columns = count / 2 / rows;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const geometry = new BufferGeometry();
    const bounds = getSceneScale(size.width / Math.max(1, size.height), tuning.trenchWidth);
    const cold = new Color("#6fd7ff");
    const violet = new Color("#9d7cff");
    const blue = new Color("#517cff");

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      const side = i < count / 2 ? -1 : 1;
      const local = i % (count / 2);
      const row = local % rows;
      const column = Math.floor(local / rows);
      positions[index] = side * (bounds.railX + 0.08 + seeded(i + 1400) * bounds.wallDepth * 0.88);
      positions[index + 1] = -bounds.wallHeight * 0.84 + (row / (rows - 1)) * bounds.wallHeight * 1.68 + (seeded(i + 1500) - 0.5) * 0.035;
      positions[index + 2] = -0.45 - (column / Math.max(1, columns - 1)) * 20.4 + (seeded(i + 1600) - 0.5) * 0.055;

      const color = seeded(i + 1800) < 0.5 ? cold : seeded(i + 1900) < 0.82 ? violet : blue;
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return { geometry, count };
  }, [size.width, size.height, tuning.trenchWidth]);

  useFrame((_, delta) => {
    const progress = progressRef.current;
    const active = ease(clamp01((progress - 0.82) / 0.12));
    const attr = data.geometry.getAttribute("position") as Float32BufferAttribute;
    const positions = attr.array as Float32Array;

    for (let i = 0; i < data.count; i += 1) {
      const index = i * 3;
      positions[index + 2] += delta * active * tuning.wallSpeed;
      if (positions[index + 2] > 3.2) {
        positions[index + 2] -= 22;
      }
    }

    attr.needsUpdate = true;
    if (ref.current) ref.current.visible = active > 0.02;
    if (glowRef.current) glowRef.current.visible = active > 0.02;
    if (matRef.current) matRef.current.opacity = active * 0.84;
    if (glowMatRef.current) glowMatRef.current.opacity = active * 0.16;
  });

  return (
    <>
      <points ref={glowRef} geometry={data.geometry}>
        <pointsMaterial
          ref={glowMatRef}
          vertexColors
          transparent
          opacity={0}
          size={0.07}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points ref={ref} geometry={data.geometry}>
        <pointsMaterial
          ref={matRef}
          vertexColors
          transparent
          opacity={0}
          size={0.027}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </>
  );
}

function TrenchAtmosphere() {
  const progressRef = usePageScroll();
  const { size } = useThree();
  const ref = useRef<Points>(null);
  const glowRef = useRef<Points>(null);
  const matRef = useRef<PointsMaterial>(null);
  const glowMatRef = useRef<PointsMaterial>(null);

  const data = useMemo(() => {
    const count = 1150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const geometry = new BufferGeometry();
    const aspect = size.width / Math.max(1, size.height);
    const cyan = new Color("#8adfff");
    const violet = new Color("#a88aff");
    const blue = new Color("#668dff");
    const rose = new Color("#ec9cff");

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      const z = 2.4 - seeded(i + 6100) * 12.6;
      const distance = 6.3 - z;
      const halfHeight = Math.tan((43 * Math.PI) / 360) * distance;
      positions[index] = (seeded(i + 6200) - 0.5) * halfHeight * aspect * 1.9;
      positions[index + 1] = (seeded(i + 6300) - 0.5) * halfHeight * 1.9;
      positions[index + 2] = z;

      const tone = seeded(i + 6400);
      const color = tone < 0.4 ? cyan : tone < 0.72 ? violet : tone < 0.9 ? blue : rose;
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return { geometry, count, aspect };
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    const progress = progressRef.current;
    const active = ease(clamp01((progress - 0.82) / 0.12));
    const attr = data.geometry.getAttribute("position") as Float32BufferAttribute;
    const positions = attr.array as Float32Array;

    for (let i = 0; i < data.count; i += 1) {
      const index = i * 3;
      positions[index + 2] += delta * active * 0.78;

      if (positions[index + 2] > 3.25) {
        const z = -10.2;
        const distance = 6.3 - z;
        const halfHeight = Math.tan((43 * Math.PI) / 360) * distance;
        positions[index] = (seeded(i + Math.floor(progress * 10000) + 6500) - 0.5) * halfHeight * data.aspect * 1.9;
        positions[index + 1] = (seeded(i + Math.floor(progress * 10000) + 6600) - 0.5) * halfHeight * 1.9;
        positions[index + 2] = z;
      }
    }

    attr.needsUpdate = true;
    if (ref.current) ref.current.visible = active > 0.02;
    if (glowRef.current) glowRef.current.visible = active > 0.02;
    if (matRef.current) matRef.current.opacity = active * 0.42;
    if (glowMatRef.current) glowMatRef.current.opacity = active * 0.18;
  });

  return (
    <>
      <points ref={glowRef} geometry={data.geometry}>
        <pointsMaterial
          ref={glowMatRef}
          vertexColors
          transparent
          opacity={0}
          size={0.13}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points ref={ref} geometry={data.geometry}>
        <pointsMaterial
          ref={matRef}
          vertexColors
          transparent
          opacity={0}
          size={0.05}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </>
  );
}

function seedBoosterParticle(
  positions: Float32Array,
  index: number,
  particle: number,
  cycle: number,
  tuning: SceneTuning,
  length = tuning.boostLength,
  spread = tuning.boostSpread
) {
  const tail = seeded(particle + cycle + 2300);
  const angle = seeded(particle + cycle + 2200) * Math.PI * 2;
  const radius = Math.sqrt(seeded(particle + cycle + 2100)) * (0.018 + tail * spread);
  positions[index] = Math.cos(angle) * radius;
  positions[index + 1] = -0.16 + Math.sin(angle) * radius * 0.72;
  positions[index + 2] = 1.12 + tail * length;
}

function BoosterTrail({ tuning, hyperdrive }: { tuning: SceneTuning; hyperdrive: boolean }) {
  const progressRef = usePageScroll();
  const globalPointer = useGlobalPointer();
  const { size } = useThree();
  const ref = useRef<Points>(null);
  const glowRef = useRef<Points>(null);
  const matRef = useRef<PointsMaterial>(null);
  const glowMatRef = useRef<PointsMaterial>(null);
  const previousShipX = useRef(0);
  const tailVelocity = useRef(0);
  const hyperStart = useRef<number | null>(null);
  const wasHyperdrive = useRef(false);
  const data = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const geometry = new BufferGeometry();
    const glowGeometry = new BufferGeometry();
    const yellow = new Color("#ffe27a");
    const orange = new Color("#ff8a2a");
    const red = new Color("#ff304f");

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      seedBoosterParticle(positions, index, i, 0, tuning);
      speeds[i] = 0.1 + seeded(i + 2400) * 0.16;

      const t = seeded(i + 2500);
      const color = t < 0.28 ? yellow : t < 0.72 ? orange : red;
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    glowGeometry.setAttribute("position", new Float32BufferAttribute(positions.slice(), 3));
    glowGeometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return { geometry, glowGeometry, speeds, count };
  }, [tuning.boostLength, tuning.boostSpread]);

  useFrame(({ clock }, delta) => {
    const progress = progressRef.current;
    if (hyperdrive && hyperStart.current === null) hyperStart.current = clock.elapsedTime;
    if (!hyperdrive) hyperStart.current = null;
    const hyperTime = hyperStart.current === null ? 0 : clock.elapsedTime - hyperStart.current;
    const hyperStretch = ease(clamp01(hyperTime / 1.55));
    const hyperLaunch = ease(clamp01(hyperTime / 2.85));
    const hyperFade = ease(clamp01((hyperTime - 2.55) / 0.72));
    const boostLength = mix(tuning.boostLength, 3.85, hyperStretch);
    const boostSpread = mix(tuning.boostSpread, tuning.boostSpread * 2.1 + 0.07, hyperStretch);
    const shipPlacement = ease(clamp01((progress - 0.78) / 0.14));
    const active = ease(clamp01((progress - 0.96) / 0.035));
    const bounds = getSceneScale(size.width / Math.max(1, size.height), tuning.trenchWidth);
    const shipY = mix(0.18 - clamp01((progress - 0.54) / 0.32) * 0.28, -1.45, shipPlacement);
    const shipX = globalPointer.current.x * shipPlacement * bounds.steerX;
    const rawVelocity = clamp01(0.5 + (shipX - previousShipX.current) / Math.max(delta, 0.001) / 16) * 16 - 8;

    if (active > 0.02) {
      tailVelocity.current += (rawVelocity - tailVelocity.current) * Math.min(1, delta * 11);
    } else {
      tailVelocity.current = 0;
    }
    previousShipX.current = shipX;

    if (hyperdrive && !wasHyperdrive.current) {
      for (const geometry of [data.geometry, data.glowGeometry]) {
        const attr = geometry.getAttribute("position") as Float32BufferAttribute;
        const positions = attr.array as Float32Array;
        for (let i = 0; i < data.count; i += 1) {
          seedBoosterParticle(positions, i * 3, i, Math.floor(hyperTime * 10000), tuning, boostLength, boostSpread);
        }
        attr.needsUpdate = true;
      }
    }
    wasHyperdrive.current = hyperdrive;

    for (const geometry of [data.geometry, data.glowGeometry]) {
      const attr = geometry.getAttribute("position") as Float32BufferAttribute;
      const positions = attr.array as Float32Array;
      for (let i = 0; i < data.count; i += 1) {
        const index = i * 3;
        const tailness = clamp01((positions[index + 2] - 1.12) / Math.max(0.01, boostLength));
        positions[index] -= tailVelocity.current * tailness * delta * tuning.boostLag;
        positions[index] += Math.sin(i * 0.41) * active * delta * 0.012 * tailness;
        positions[index + 1] += Math.cos(i * 0.29) * active * delta * 0.008 * tailness;
        positions[index + 2] += data.speeds[i] * active * delta * (1 + hyperStretch * 42);
        if (positions[index + 2] > 1.12 + boostLength) {
          seedBoosterParticle(positions, index, i, Math.floor((progress + hyperTime) * 10000), tuning, boostLength, boostSpread);
        }
      }
      attr.needsUpdate = true;
    }

    if (ref.current) {
      ref.current.visible = active > 0.02;
      ref.current.position.x = shipX;
      ref.current.position.y = shipY;
      ref.current.position.z = -hyperLaunch * 18;
      ref.current.rotation.x = 0;
      ref.current.rotation.z = 0;
    }
    if (glowRef.current) {
      glowRef.current.visible = active > 0.02;
      glowRef.current.position.x = shipX;
      glowRef.current.position.y = shipY;
      glowRef.current.position.z = -hyperLaunch * 18;
      glowRef.current.rotation.x = 0;
    }
    if (matRef.current) {
      matRef.current.opacity = active * (0.4 + hyperStretch * 0.38) * (1 - hyperFade);
      matRef.current.size = 0.018 + hyperStretch * 0.026;
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = active * (0.12 + hyperStretch * 0.24) * (1 - hyperFade);
      glowMatRef.current.size = 0.055 + hyperStretch * 0.075;
    }
  });

  return (
    <>
      <points ref={glowRef} geometry={data.glowGeometry}>
        <pointsMaterial
          ref={glowMatRef}
          vertexColors
          transparent
          opacity={0}
          size={0.055}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points ref={ref} geometry={data.geometry}>
        <pointsMaterial
          ref={matRef}
          vertexColors
          transparent
          opacity={0}
          size={0.018}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </>
  );
}

function seedHyperStreak(
  positions: Float32Array,
  index: number,
  streak: number,
  aspect: number,
  length: number,
  cycle: number
) {
  const z = 2.2 - seeded(streak + cycle + 7100) * 14;
  const distance = 6.4 - z;
  const halfHeight = Math.tan((43 * Math.PI) / 360) * distance;
  const x = (seeded(streak + cycle + 7200) - 0.5) * halfHeight * aspect * 1.9;
  const y = (seeded(streak + cycle + 7300) - 0.5) * halfHeight * 1.9;
  positions[index] = x;
  positions[index + 1] = y;
  positions[index + 2] = z;
  positions[index + 3] = x;
  positions[index + 4] = y;
  positions[index + 5] = z - length;
}

function HyperdriveStreaks({ hyperdrive }: { hyperdrive: boolean }) {
  const { size } = useThree();
  const ref = useRef<LineSegments>(null);
  const matRef = useRef<LineBasicMaterial>(null);
  const startedAt = useRef<number | null>(null);
  const data = useMemo(() => {
    const count = 850;
    const positions = new Float32Array(count * 6);
    const colors = new Float32Array(count * 6);
    const geometry = new BufferGeometry();
    const aspect = size.width / Math.max(1, size.height);
    const cyan = new Color("#a5ecff");
    const violet = new Color("#b59aff");
    const blue = new Color("#6f92ff");

    for (let i = 0; i < count; i += 1) {
      const index = i * 6;
      seedHyperStreak(positions, index, i, aspect, 0.12, 0);
      const color = seeded(i + 7400) < 0.48 ? cyan : seeded(i + 7500) < 0.8 ? violet : blue;
      for (let channel = 0; channel < 2; channel += 1) {
        colors[index + channel * 3] = color.r;
        colors[index + channel * 3 + 1] = color.g;
        colors[index + channel * 3 + 2] = color.b;
      }
    }

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return { geometry, count, aspect };
  }, [size.width, size.height]);

  useFrame(({ clock }, delta) => {
    if (hyperdrive && startedAt.current === null) startedAt.current = clock.elapsedTime;
    if (!hyperdrive) startedAt.current = null;
    const elapsed = startedAt.current === null ? 0 : clock.elapsedTime - startedAt.current;
    const stretch = ease(clamp01(elapsed / 1.4));
    const fade = ease(clamp01((elapsed - 2.75) / 0.72));
    const active = hyperdrive ? 1 - fade : 0;
    const attr = data.geometry.getAttribute("position") as Float32BufferAttribute;
    const positions = attr.array as Float32Array;
    const length = 0.12 + stretch * 3.6;

    if (hyperdrive) {
      for (let i = 0; i < data.count; i += 1) {
        const index = i * 6;
        positions[index + 2] += delta * (2.1 + stretch * 18);
        positions[index + 5] = positions[index + 2] - length;
        if (positions[index + 2] > 3.8) {
          seedHyperStreak(positions, index, i, data.aspect, length, Math.floor(elapsed * 10000));
        }
      }
      attr.needsUpdate = true;
    }

    if (ref.current) ref.current.visible = active > 0.02;
    if (matRef.current) matRef.current.opacity = active * (0.32 + stretch * 0.5);
  });

  return (
    <lineSegments ref={ref} geometry={data.geometry}>
      <lineBasicMaterial ref={matRef} vertexColors transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

function Field({ tuning, hyperdrive }: { tuning: SceneTuning; hyperdrive: boolean }) {
  return (
    <>
      <color attach="background" args={["#010309"]} />
      <fog attach="fog" args={["#010309", 5, 13]} />
      <ambientLight intensity={0.3} />
      <ParticleGlow />
      <TunnelField tuning={tuning} />
      <TrenchAtmosphere />
      <BoosterTrail tuning={tuning} hyperdrive={hyperdrive} />
      <HyperdriveStreaks hyperdrive={hyperdrive} />
      <ParticleSculpture tuning={tuning} hyperdrive={hyperdrive} />
    </>
  );
}

function TuningSlider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="scene-tuning-control">
      <span>
        {label}
        <b>{value.toFixed(2)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SceneTuningPanel({
  tuning,
  onChange
}: {
  tuning: SceneTuning;
  onChange: (key: keyof SceneTuning, value: number) => void;
}) {
  return (
    <aside className="scene-tuning" aria-label="Scene tuning controls">
      <p>Live scene tuning</p>
      <TuningSlider label="Trench width" value={tuning.trenchWidth} min={0.65} max={1.4} step={0.01} onChange={(value) => onChange("trenchWidth", value)} />
      <TuningSlider label="Wall speed" value={tuning.wallSpeed} min={0.35} max={1.55} step={0.01} onChange={(value) => onChange("wallSpeed", value)} />
      <TuningSlider label="Boost length" value={tuning.boostLength} min={0.22} max={0.85} step={0.01} onChange={(value) => onChange("boostLength", value)} />
      <TuningSlider label="Boost spread" value={tuning.boostSpread} min={0.1} max={0.62} step={0.01} onChange={(value) => onChange("boostSpread", value)} />
      <TuningSlider label="Boost lag" value={tuning.boostLag} min={0} max={0.65} step={0.01} onChange={(value) => onChange("boostLag", value)} />
      <TuningSlider label="Direction height" value={tuning.directionY} min={-1.15} max={-0.25} step={0.01} onChange={(value) => onChange("directionY", value)} />
    </aside>
  );
}

export default function DotSpaceExperience({ hyperdrive = false }: { hyperdrive?: boolean }) {
  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [tuneMode, setTuneMode] = useState(false);

  useEffect(() => {
    setTuneMode(new URLSearchParams(window.location.search).get("tune") === "1");
  }, []);

  return (
    <>
      <Canvas
        className="dot-canvas"
        camera={{ position: [0, 0, 7.1], fov: 43, near: 0.1, far: 40 }}
        dpr={[1, 1.65]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Field tuning={tuning} hyperdrive={hyperdrive} />
      </Canvas>
      {tuneMode ? (
        <SceneTuningPanel
          tuning={tuning}
          onChange={(key, value) => setTuning((current) => ({ ...current, [key]: value }))}
        />
      ) : null}
    </>
  );
}

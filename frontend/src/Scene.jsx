import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  cameraPose,
  clamp,
  damp,
  smoothRange,
  progressFromTops,
} from "./camera-path";
import {
  shellSegment,
  cutWall,
  seamCurve,
  roundedFrame,
} from "./core-geometry";

export function Scene({ still, onFailure }) {
  const host = useRef(null);
  useEffect(() => {
    const el = host.current;
    let renderer,
      composer,
      environment,
      pmrem,
      scene,
      disposed = false,
      frame = 0;
    const textures = [],
      geometries = new Set(),
      materials = new Set(),
      listeners = [];
    const listen = (target, event, fn, options) => {
      target.addEventListener(event, fn, options);
      listeners.push(() => target.removeEventListener(event, fn, options));
    };
    function dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      listeners.forEach((off) => off());
      scene?.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        for (const m of Array.isArray(o.material)
          ? o.material
          : o.material
            ? [o.material]
            : [])
          materials.add(m);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      environment?.texture.dispose();
      pmrem?.dispose();
      composer?.dispose();
      renderer?.dispose();
      el.replaceChildren();
    }
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, innerWidth <= 700 ? 1.35 : 1.65),
      );
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.setClearColor(0x080b14);
      el.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x080b14);
      scene.fog = new THREE.FogExp2(0x080b14, 0.036);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.075, 100);
      pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.035);
      room.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.45;
      // Fine satin response comes from a repeatable roughness/bump field, not surface decorations.
      let seed = 71;
      const grain = new Uint8Array(256 * 256 * 4);
      for (let i = 0; i < grain.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const v = 155 + (seed % 85);
        grain[i] = grain[i + 1] = grain[i + 2] = v;
        grain[i + 3] = 255;
      }
      const texture = new THREE.DataTexture(grain, 256, 256, THREE.RGBAFormat);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 10);
      texture.needsUpdate = true;
      textures.push(texture);
      const graphite = new THREE.MeshPhysicalMaterial({
        color: 0x131622,
        metalness: 0.85,
        roughness: 0.53,
        roughnessMap: texture,
        bumpMap: texture,
        bumpScale: 0.007,
        clearcoat: 0.22,
        clearcoatRoughness: 0.38,
      });
      const cutMetal = new THREE.MeshStandardMaterial({
        color: 0x223344,
        metalness: 0.83,
        roughness: 0.36,
        side: THREE.DoubleSide,
      });
      const glow = (color, power) =>
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: power,
          metalness: 0.25,
          roughness: 0.28,
        });
      const cyan = glow(0x11cce6, 1.3),
        violet = glow(0x8050e3, 0.8),
        lime = glow(0xb8e92b, 0.85);
      const inner = new THREE.MeshStandardMaterial({
        color: 0x075065,
        emissive: 0x00abc9,
        emissiveIntensity: 1.15,
        roughness: 0.3,
        metalness: 0.1,
        envMapIntensity: 0.12,
        side: THREE.DoubleSide,
      });
      scene.add(new THREE.AmbientLight(0x9ba4cb, 0.34));
      const key = new THREE.DirectionalLight(0xc5d9ff, 2.7);
      key.position.set(-4, 7, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9260ff, 2.8);
      rim.position.set(-5, 3, -3);
      scene.add(rim);
      function mesh(geo, mat, parent, pos = [0, 0, 0]) {
        const o = new THREE.Mesh(geo, mat);
        o.position.set(...pos);
        parent.add(o);
        return o;
      }
      function tube(curve, radius, mat, parent, segments = 80) {
        return mesh(
          new THREE.TubeGeometry(curve, segments, radius, 6, false),
          mat,
          parent,
        );
      }
      const core = new THREE.Group();
      core.position.set(-2.75, 0.05, 0);
      core.rotation.set(0.05, -0.14, -0.3);
      scene.add(core);
      const front = new THREE.Group(),
        back = new THREE.Group(),
        channel = new THREE.Group();
      core.add(front, back, channel);
      const slitA = 2.12,
        slitB = 2.63;
      mesh(shellSegment(0, slitA), graphite, front);
      mesh(shellSegment(slitB, Math.PI * 2 - slitB), graphite, back);
      const innerMetal = graphite.clone();
      innerMetal.side = THREE.BackSide;
      mesh(shellSegment(0, slitA, { inner: true }), innerMetal, front);
      mesh(
        shellSegment(slitB, Math.PI * 2 - slitB, { inner: true }),
        innerMetal,
        back,
      );
      mesh(cutWall(slitA), cutMetal, front);
      mesh(cutWall(slitB), cutMetal, back);
      mesh(shellSegment(slitA, slitB - slitA, { inner: true }), inner, channel);
      tube(seamCurve(slitA, 0.993), 0.009, cyan, front);
      tube(seamCurve(slitB, 0.993), 0.009, cyan, back);
      // Only the outer silhouette receives the violet rim; the face stays dark graphite.
      const contour = new THREE.EllipseCurve(
        0,
        0,
        2.45,
        3.72,
        Math.PI * 0.44,
        Math.PI * 1.43,
        false,
      );
      tube(
        new THREE.CatmullRomCurve3(
          contour.getPoints(120).map((p) => new THREE.Vector3(p.x, p.y, 0.025)),
        ),
        0.011,
        violet,
        front,
        120,
      );
      for (let i = 0; i < 9; i++) {
        const t = 0.45 + i * 0.275,
          r = Math.sin(t),
          y = 3.72 * Math.cos(t);
        const start = new THREE.Vector3(
          -2.45 * 0.94 * Math.cos(slitA) * r,
          y,
          0.86 * 0.78 * Math.sin(slitA) * r,
        );
        const end = new THREE.Vector3(
          -2.45 * 0.94 * Math.cos(slitB) * r,
          y - 0.095,
          0.86 * 0.78 * Math.sin(slitB) * r,
        );
        const mid = start.clone().lerp(end, 0.5);
        mid.z -= 0.11;
        tube(
          new THREE.CatmullRomCurve3([start, mid, end]),
          0.035,
          cutMetal,
          channel,
          12,
        );
        const highlight = start.clone().lerp(mid, 0.4);
        highlight.y += 0.035;
        tube(new THREE.LineCurve3(start, highlight), 0.009, cyan, channel, 4);
      }
      const cavityLight = new THREE.PointLight(0x17cfff, 4.5, 5, 2);
      cavityLight.position.set(1.5, 0, 0.9);
      core.add(cavityLight);
      // Successive worlds occupy one continuous volume. Every opening has real clearance.
      const agent = new THREE.Group();
      agent.position.set(-2, 0, -17);
      scene.add(agent);
      const nodeGeo = new RoundedBoxGeometry(0.8, 0.57, 0.19, 3, 0.07),
        nodes = [];
      const locations = [
        [0, 1.8, 0],
        [-1.5, 0.45, 0],
        [0, 0.45, -0.15],
        [1.5, 0.45, 0],
        [-1, -1.2, -0.2],
        [1, -1.2, -0.2],
      ];
      locations.forEach((p, i) => {
        const o = mesh(nodeGeo, i === 2 ? lime : graphite, agent, p);
        o.rotation.y = -0.12;
        nodes.push(o);
        const frame = mesh(
          roundedFrame(0.86, 0.63, 0.1, 0.035),
          i === 2 ? lime : cyan,
          agent,
          [p[0], p[1], p[2] - 0.04],
        );
        frame.rotation.y = -0.12;
      });
      for (const [a, b] of [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 4],
        [2, 4],
        [2, 5],
        [3, 5],
      ]) {
        const start = new THREE.Vector3(...locations[a]),
          end = new THREE.Vector3(...locations[b]);
        start.z -= 0.12;
        end.z -= 0.12;
        const mid = start.clone().lerp(end, 0.5);
        mid.z -= 0.4;
        tube(
          new THREE.CatmullRomCurve3([start, mid, end]),
          0.014,
          cyan,
          agent,
          22,
        );
      }
      mesh(roundedFrame(4.9, 5.5, 0.55, 0.18), graphite, agent, [0, 0, -1.5]);
      mesh(roundedFrame(4.62, 5.22, 0.5, 0.045), cyan, agent, [0, 0, -1.35]);
      const air = new THREE.Group();
      air.position.set(-2, 0, -33);
      scene.add(air);
      const airFrames = [];
      for (let i = 0; i < 6; i++) {
        const g = new THREE.Group();
        g.position.z = -i * 1.25;
        g.rotation.z = i * 0.085;
        air.add(g);
        airFrames.push(g);
        mesh(roundedFrame(4.75, 5.2, 0.6, 0.17), graphite, g);
        mesh(
          roundedFrame(4.48, 4.93, 0.53, 0.035),
          i % 2 ? violet : cyan,
          g,
          [0, 0, 0.12],
        );
      }
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0x7754ba,
        metalness: 0.16,
        roughness: 0.16,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      for (let i = 0; i < 4; i++) {
        const p = mesh(new THREE.BoxGeometry(0.45, 1.05, 0.08), glass, air, [
          (i % 2 ? 1 : -1) * 1.7,
          i < 2 ? 0.7 : -0.7,
          -i * 1.2,
        ]);
        p.rotation.y = i % 2 ? -0.35 : 0.35;
      }
      const kom = new THREE.Group();
      kom.position.set(-2, 0, -53);
      scene.add(kom);
      const modules = [];
      for (let i = 0; i < 7; i++) {
        const x = ((i % 3) - 1) * 1.2,
          y = (Math.floor(i / 3) - 1) * 1.15,
          z = -(i % 2) * 0.7;
        const o = mesh(
          new RoundedBoxGeometry(1.05, 0.8, 0.3, 3, 0.07),
          i % 3 === 0 ? lime : graphite,
          kom,
          [x, y, z],
        );
        o.rotation.set(0.12, -0.2, 0.07);
        modules.push(o);
        if (i % 3 !== 0) {
          const edge = mesh(roundedFrame(1.08, 0.83, 0.08, 0.03), lime, kom, [
            x,
            y,
            z + 0.19,
          ]);
          edge.rotation.copy(o.rotation);
        }
      }
      const portalGlow = new THREE.PointLight(0x8050ff, 7, 12, 2);
      portalGlow.position.set(-2, 1, -33);
      scene.add(portalGlow);
      const komLight = new THREE.PointLight(0xc9f73b, 5, 9, 2);
      komLight.position.set(-2, 1, -50);
      scene.add(komLight);
      // Clone per-world materials so their distance fades never alter the other worlds.
      const fading = [agent, air, kom].map((group) => {
        const cache = new Map();
        group.traverse((o) => {
          if (!o.material) return;
          const source = o.material;
          if (!cache.has(source)) {
            const m = source.clone();
            m.transparent = true;
            cache.set(source, m);
          }
          o.material = cache.get(source);
        });
        return {
          group,
          materials: [...cache.values()].map((m) => ({
            m,
            opacity: m.opacity,
          })),
        };
      });
      const composerSize = new THREE.Vector2();
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(composerSize, 0.3, 0.35, 1.05));
      composer.addPass(new OutputPass());
      const chapters = [...document.querySelectorAll(".chapter")];
      const anchors = [
        ...document.querySelectorAll(".hero,.chapter"),
        document.querySelector("#work"),
      ].filter(Boolean);
      let width = innerWidth,
        height = innerHeight,
        target = 0,
        progress = 0,
        lastTime = 0,
        active = true;
      function request() {
        if (!disposed && !frame && active)
          frame = requestAnimationFrame(render);
      }
      function readScroll() {
        target = progressFromTops(
          anchors.map((n) => n.getBoundingClientRect().top),
        );
        const bounds = document
          .querySelector(".journey")
          .getBoundingClientRect();
        active = bounds.bottom > 0 && bounds.top < height;
        el.style.opacity = String(1 - smoothRange(3.7, 4, target));
        if (active) request();
      }
      function resize() {
        width = innerWidth;
        height = innerHeight;
        renderer.setSize(width, height);
        composer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        readScroll();
      }
      function fade(index, value) {
        const { group, materials } = fading[index];
        group.visible = value > 0.001;
        for (const { m, opacity } of materials) m.opacity = opacity * value;
      }
      function render(time) {
        frame = 0;
        if (disposed || !active) return;
        const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
        lastTime = time;
        progress = still ? 0 : damp(progress, target, dt);
        if (Math.abs(progress - target) < 0.0001) progress = target;
        const p = clamp(progress, 0, 4),
          mobile = width <= 700,
          tablet = width > 700 && width <= 1100,
          pose = cameraPose(p);
        camera.position.fromArray(pose.position);
        const look = new THREE.Vector3(...pose.look);
        if (mobile) {
          const mobileBlend = 1 - smoothRange(0.15, 0.8, p);
          camera.position.y += mobileBlend * 2.45;
          look.y += mobileBlend * 2.45;
          const entryShift =
            mobileBlend * 0.65 +
            1.55 *
              smoothRange(0.18, 0.46, p) *
              (1 - smoothRange(0.65, 0.95, p));
          camera.position.x += entryShift;
          look.x += entryShift;
        }
        if (tablet) {
          const distance =
            (height > width ? 5.5 : 2) * (1 - smoothRange(0.2, 0.9, p));
          camera.position.z += distance;
          look.z += distance;
        }
        camera.lookAt(look);
        core.position.x = mobile ? -1.2 : tablet ? -3.2 : -2.75;
        core.scale.setScalar(mobile ? 0.62 : tablet ? 0.8 : 0.91);
        const opening = smoothRange(0.18, 0.58, p);
        front.position.x = -opening * 1.8;
        front.rotation.y = -opening * 0.23;
        back.position.x = opening * 1.15;
        back.rotation.y = opening * 0.3;
        channel.scale.x = 1 + opening * 2.2;
        channel.visible = p < 0.85;
        core.visible = p < 1.05;
        const weights = [
          smoothRange(0.52, 0.86, p) * (1 - smoothRange(1.56, 1.82, p)),
          smoothRange(1.38, 1.78, p) * (1 - smoothRange(2.64, 2.87, p)),
          smoothRange(2.6, 2.95, p),
        ];
        weights.forEach((v, i) => fade(i, v));
        for (const group of [agent, air, kom]) {
          group.position.x = mobile ? -0.7 : -2;
          group.scale.setScalar(mobile ? 0.72 : 1);
        }
        nodes.forEach((o, i) => {
          o.position.z =
            locations[i][2] +
            (1 - smoothRange(0.62, 0.97, p)) * (i % 2 ? 0.7 : -0.7);
        });
        modules.forEach((o, i) => {
          const unfold = 1 - smoothRange(2.65, 3.03, p);
          o.rotation.y = -0.2 + unfold * (i % 2 ? 0.45 : -0.45);
        });
        chapters.forEach((chapter, i) => {
          const reveal = smoothRange(i + 0.65, i + 0.96, p);
          chapter.style.setProperty("--screen-reveal", String(reveal));
        });
        el.dataset.progress = p.toFixed(4);
        el.dataset.stage = String(Math.min(3, Math.floor(p)));
        composer.render();
        if (Math.abs(progress - target) > 0.0001 && !still) request();
      }
      const lost = (e) => {
        e.preventDefault();
        onFailure();
      };
      listen(renderer.domElement, "webglcontextlost", lost);
      listen(window, "scroll", readScroll, { passive: true });
      listen(window, "resize", resize);
      listen(document, "visibilitychange", () => {
        lastTime = 0;
        if (!document.hidden) request();
      });
      // Direct entry to a chapter starts at its authored pose instead of playing a film from hero.
      target = progressFromTops(
        anchors.map((n) => n.getBoundingClientRect().top),
      );
      progress = target;
      resize();
      request();
      return dispose;
    } catch (error) {
      dispose();
      onFailure();
    }
  }, [still, onFailure]);
  return <div ref={host} className="scene" aria-hidden="true" />;
}

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface DialloStageProps {
  isLit?: boolean;
}

// Diallo exact mathematical constants
const WALL_Z = -0.62;
const AIM_DEFAULT = { x: 0, y: 1.55, z: WALL_Z };
const LAMP_REST = { x: 0, y: 1.76, z: 1.55 };
const ANCHOR_Y = 5.5;
const SENSITIVITY = { x: 0.34, y: 0.22 };

export const DialloStage: React.FC<DialloStageProps> = ({ isLit = true }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [telemetry, setTelemetry] = useState({ x: -1.86, y: -0.51, k: 2780 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040303);
    scene.fog = new THREE.FogExp2(0x040303, 0.045);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 50);
    const camPosHero = new THREE.Vector3(0, 1.38, 3.85);
    const camLookHero = new THREE.Vector3(0, 1.15, -0.62);

    // Cinematic angle when scrolled down (elevated 3/4 perspective pulled back into background depth)
    const camPosCine = new THREE.Vector3(2.35, 2.35, 4.2);
    const camLookCine = new THREE.Vector3(0.2, 0.65, -0.65);

    const currentCamPos = camPosHero.clone();
    const currentCamLook = camLookHero.clone();
    camera.position.copy(currentCamPos);
    camera.lookAt(currentCamLook);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Texture for the Back Wall with YOURCTF & UV Hacker Markings
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 2048;
    wallCanvas.height = 1024;
    const ctx = wallCanvas.getContext('2d');
    if (ctx) {
      // Concrete plaster dark base
      ctx.fillStyle = '#0d0b09';
      ctx.fillRect(0, 0, 2048, 1024);

      // Clean, subtle concrete texture
      for (let i = 0; i < 12000; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.025)';
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Large central stencil text "YOURCTF" - shifted down comfortably so it's not hidden under the top navbar
      ctx.font = 'bold 165px "Big Shoulders Stencil", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Warm amber architectural stencil fill (clean, without noisy speckles)
      ctx.fillStyle = 'rgba(240, 218, 178, 0.38)';
      ctx.fillText('YOURCTF', 1024, 530);

      ctx.strokeStyle = 'rgba(255, 235, 195, 0.22)';
      ctx.lineWidth = 2.5;
      ctx.strokeText('YOURCTF', 1024, 530);

      // Secret Hacker UV graffiti on the wall
      ctx.font = '500 24px "Caveat", "IBM Plex Mono", cursive';
      ctx.fillStyle = 'rgba(0, 239, 252, 0.42)';
      ctx.fillText('FLAG{r00m_lit_by_l4mpl1ght_2026}', 520, 360);
      ctx.fillText('defcon war room // active', 1540, 380);
      ctx.fillText('12 targets armed → breachers ready', 1500, 720);
      ctx.fillText('I = I₀ / d²', 540, 680);
    }
    const wallTexture = new THREE.CanvasTexture(wallCanvas);

    // Wall mesh - lowered so text sits perfectly in view below navbar
    const wallGeo = new THREE.PlaneGeometry(16, 9);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.9,
      metalness: 0.05,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 1.15, WALL_Z);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Floor with warm sheen
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0807,
      roughness: 0.65,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.56;
    floor.receiveShadow = true;
    scene.add(floor);

    // 3. Load /room.glb with DracoLoader
    let roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // CRT monitor canvas texture
    const crtCanvas = document.createElement('canvas');
    crtCanvas.width = 512;
    crtCanvas.height = 512;
    const crtCtx = crtCanvas.getContext('2d');
    const crtTexture = new THREE.CanvasTexture(crtCanvas);

    const updateCrtScreen = (time: number) => {
      if (!crtCtx) return;
      crtCtx.fillStyle = '#0a1a0e';
      crtCtx.fillRect(0, 0, 512, 512);

      crtCtx.font = 'bold 22px monospace';
      crtCtx.fillStyle = '#39ff6e';
      crtCtx.fillText('YOURCTF WAR ROOM v0.1.0', 30, 50);
      crtCtx.font = '16px monospace';
      crtCtx.fillStyle = '#22c55e';
      crtCtx.fillText('STATUS: QUALIFIERS LIVE', 30, 90);
      crtCtx.fillText('PORT: 4000 // WS ACTIVE', 30, 120);
      crtCtx.fillText('ACTIVE TARGETS: 12 / 12', 30, 150);
      crtCtx.fillText('TOP SOLVE: 0xDEADBEEF', 30, 180);
      crtCtx.fillText('ENCRYPTION: AES-256-GCM', 30, 210);

      // Scanline grid
      for (let y = 0; y < 512; y += 4) {
        crtCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        crtCtx.fillRect(0, y, 512, 2);
      }

      // Blinking cursor
      if (Math.floor(time * 2) % 2 === 0) {
        crtCtx.fillStyle = '#39ff6e';
        crtCtx.fillRect(30, 240, 14, 20);
      }
      crtTexture.needsUpdate = true;
    };

    let robotMesh: THREE.Object3D | null = null;

    gltfLoader.load(
      '/room.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Enhance materials
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.max(mat.roughness || 0.4, 0.35);
              mat.needsUpdate = true;
            }

            // Bind CRT screen texture
            if (mesh.name === 'Screen') {
              mesh.material = new THREE.MeshBasicMaterial({
                map: crtTexture,
                toneMapped: false,
              });
            }

            if (mesh.name === 'Robot') {
              robotMesh = mesh;
            }
          }
        });
        roomGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn('Could not load room.glb directly, building fallback desk', err);
      }
    );

    // 4. Exact Lathe Industrial Lamp Shade (Diallo's profile curve)
    const points = [
      [0.012, 0.19],
      [0.028, 0.18],
      [0.034, 0.15],
      [0.05, 0.12],
      [0.085, 0.085],
      [0.12, 0.045],
      [0.145, 0.012],
      [0.152, 0],
    ]
      .reverse()
      .map(([r, z]) => new THREE.Vector2(r, z));

    const shadeGeo = new THREE.LatheGeometry(points, 48);
    shadeGeo.rotateX(-Math.PI / 2);

    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x181410,
      metalness: 0.6,
      roughness: 0.32,
      side: THREE.DoubleSide,
    });

    const lampGroup = new THREE.Group();
    lampGroup.position.set(LAMP_REST.x, LAMP_REST.y, LAMP_REST.z);

    const shadeMesh = new THREE.Mesh(shadeGeo, shadeMat);
    shadeMesh.castShadow = true;
    lampGroup.add(shadeMesh);

    // Brass collar
    const collarGeo = new THREE.CylinderGeometry(0.022, 0.026, 0.06, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x362c22,
      metalness: 0.85,
      roughness: 0.28,
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0, -0.215);
    lampGroup.add(collar);

    // Glowing bulb inside shade
    const bulbGeo = new THREE.SphereGeometry(0.045, 24, 16);
    const bulbMat = new THREE.MeshBasicMaterial({
      color: 0xffe6be,
      toneMapped: false,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, 0, 0.035);
    lampGroup.add(bulb);

    // Hanging wire between ceiling anchor and lamp
    const wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 1, 8, 1, true);
    wireGeo.translate(0, 0.5, 0);
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x0f0d0b,
      roughness: 0.6,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // Spotlight pointing toward cursor
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(AIM_DEFAULT.x, AIM_DEFAULT.y, AIM_DEFAULT.z);
    scene.add(spotTarget);

    const spotLight = new THREE.SpotLight(0xf4ddb8, isLit ? 34 : 0.6);
    spotLight.angle = 0.58;
    spotLight.penumbra = 0.78;
    spotLight.decay = 2.0;
    spotLight.distance = 0;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.bias = -0.0004;
    spotLight.shadow.radius = 12;
    spotLight.target = spotTarget;
    lampGroup.add(spotLight);

    // PointLight inside bulb for warm atmospheric fill
    const bulbPointLight = new THREE.PointLight(0xe8d2ae, isLit ? 3.8 : 0.2, 6, 1.4);
    lampGroup.add(bulbPointLight);

    // Ambient light so shadows remain readable and rich
    const ambientLight = new THREE.AmbientLight(0x2a221a, 1.3);
    scene.add(ambientLight);

    // Volumetric soft cone shader (Diallo custom haze)
    const coneGeo = new THREE.CylinderGeometry(0.03, 1, 1, 48, 1, true);
    coneGeo.translate(0, -0.5, 0);
    coneGeo.rotateX(-Math.PI / 2);

    const coneUniforms = {
      uColor: { value: new THREE.Color(0xf4ddb8) },
      uOpacity: { value: 0.08 },
      uPower: { value: isLit ? 1.0 : 0.0 },
      uTime: { value: 0 },
    };

    const coneShaderMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: coneUniforms,
      vertexShader: `
        varying float vAxial;
        varying vec3 vNormalV;
        varying vec3 vViewPos;
        varying vec3 vWorld;
        void main() {
          vAxial = uv.y;
          vNormalV = normalMatrix * normal;
          vViewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAxial;
        varying vec3 vNormalV;
        varying vec3 vViewPos;
        varying vec3 vWorld;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uPower;
        uniform float uTime;

        float hash(vec3 p) { return fract(sin(dot(p, vec3(17.1, 113.7, 41.3))) * 43758.5453); }
        float noise(vec3 p) {
          vec3 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        void main() {
          float facing = abs(dot(normalize(vNormalV), normalize(-vViewPos)));
          float core = pow(facing, 1.35);
          float along = smoothstep(0.0, 0.06, vAxial) * pow(1.0 - clamp(vAxial, 0.0, 1.0), 1.4);
          float haze = 0.55 + 0.45 * noise(vWorld * 2.6 + vec3(0.0, uTime * 0.05, uTime * 0.03));
          float a = uOpacity * core * along * haze * uPower;
          gl_FragColor = vec4(uColor * a, 1.0);
        }
      `,
    });

    const lightConeMesh = new THREE.Mesh(coneGeo, coneShaderMat);
    lightConeMesh.scale.set(1.8, 1.8, 3.8);
    lampGroup.add(lightConeMesh);

    scene.add(lampGroup);

    // 5. Floating Dust Motes - reduced quantity (just ~45 subtle glowing motes, no "stars" clutter)
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 2.6;
      particlePositions[i3 + 1] = 0.5 + Math.random() * 2.2;
      particlePositions[i3 + 2] = 0.3 + Math.random() * 1.8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Circular soft glowing particle sprite
    const circleCanvas = document.createElement('canvas');
    circleCanvas.width = 64;
    circleCanvas.height = 64;
    const circleCtx = circleCanvas.getContext('2d');
    if (circleCtx) {
      const grad = circleCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(255, 230, 185, 0.7)');
      grad.addColorStop(1, 'rgba(255, 215, 160, 0)');
      circleCtx.fillStyle = grad;
      circleCtx.beginPath();
      circleCtx.arc(32, 32, 32, 0, Math.PI * 2);
      circleCtx.fill();
    }
    const circleTexture = new THREE.CanvasTexture(circleCanvas);

    const particleMat = new THREE.PointsMaterial({
      color: 0xffe8c8,
      size: 0.024,
      map: circleTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(dustParticles);

    // 6. Physics State & Tracking
    const mouse = { x: 0, y: 0, nx: 0, ny: 0 };
    const aim = new THREE.Vector3(AIM_DEFAULT.x, AIM_DEFAULT.y, AIM_DEFAULT.z);
    const aimTarget = new THREE.Vector3(AIM_DEFAULT.x, AIM_DEFAULT.y, AIM_DEFAULT.z);
    const lampPos = new THREE.Vector3(LAMP_REST.x, LAMP_REST.y, LAMP_REST.z);
    const lampTarget = new THREE.Vector3(LAMP_REST.x, LAMP_REST.y, LAMP_REST.z);
    const lampVel = new THREE.Vector3(0, 0, 0);

    const anchor = new THREE.Vector3(0, ANCHOR_Y, 1.4);

    let scrollY = window.scrollY;
    let smoothScroll = 0;

    // Interactive camera parallax & drag inertia state
    const camParallax = new THREE.Vector3(0, 0, 0);
    const camParallaxTarget = new THREE.Vector3(0, 0, 0);
    const lookParallax = new THREE.Vector3(0, 0, 0);
    const lookParallaxTarget = new THREE.Vector3(0, 0, 0);

    let isDragging = false;
    const prevPointer = { x: 0, y: 0 };
    const dragOffset = new THREE.Vector2(0, 0);
    const dragVel = new THREE.Vector2(0, 0);

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('button') ||
        target?.closest('a') ||
        target?.closest('input') ||
        target?.closest('textarea') ||
        target?.closest('.diallo-cta')
      ) {
        return;
      }
      isDragging = true;
      prevPointer.x = e.clientX;
      prevPointer.y = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - prevPointer.x) / window.innerWidth;
      const dy = (e.clientY - prevPointer.y) / window.innerHeight;
      prevPointer.x = e.clientX;
      prevPointer.y = e.clientY;

      dragVel.x += dx * 1.8;
      dragVel.y += dy * 1.8;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ny = -(e.clientY / window.innerHeight) * 2 + 1;

      // Subtle parallax camera tilt & pan depth
      camParallaxTarget.x = mouse.nx * 0.24;
      camParallaxTarget.y = mouse.ny * 0.15;
      camParallaxTarget.z = -(Math.abs(mouse.nx) + Math.abs(mouse.ny)) * 0.06;

      lookParallaxTarget.x = mouse.nx * 0.14;
      lookParallaxTarget.y = mouse.ny * 0.09;

      // Project onto back wall plane for lamp aim
      aimTarget.x = THREE.MathUtils.clamp(mouse.nx * 2.8, -2.9, 2.9);
      aimTarget.y = THREE.MathUtils.clamp(mouse.ny * 1.5 + 1.5, 0.4, 3.2);

      setTelemetry({
        x: parseFloat((mouse.nx * 2.4).toFixed(2)),
        y: parseFloat((mouse.ny * 1.6).toFixed(2)),
        k: Math.round(2780 + mouse.nx * 150),
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop with Cinematic Scroll Camera Transition & Inertia
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 1 / 30);
      const time = clock.getElapsedTime();

      // Update CRT Screen
      updateCrtScreen(time);

      // Smooth scroll progress across the entire page (0 at top, 1 at bottom)
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const rawProgress = THREE.MathUtils.clamp(scrollY / maxScroll, 0, 1);
      smoothScroll += (rawProgress - smoothScroll) * Math.min(1, 6 * dt);

      // Cinematic camera interpolation:
      // - At top (Home / Hero): frontal cinematic view
      // - Throughout middle (Architecture, Disciplines, Operations, Scoreboard): elevated 3/4 isometric background angle
      // - At bottom (Outro / Join War Room): glides BACK to frontal cinematic view, bookending the site
      let cineWeight = 0;
      if (smoothScroll < 0.14) {
        // Leaving hero: 0 -> 1
        const u = smoothScroll / 0.14;
        cineWeight = u * u * (3 - 2 * u);
      } else if (smoothScroll > 0.66) {
        // Approaching bottom (Outro / Join War Room): 1 -> 0 (returns to hero view at the last chapter)
        const u = Math.max(0, Math.min(1, (smoothScroll - 0.66) / (0.88 - 0.66)));
        const ease = u * u * (3 - 2 * u);
        cineWeight = 1.0 - ease;
      } else {
        // Middle chapters: fully in 3/4 background view
        cineWeight = 1.0;
      }

      currentCamPos.lerpVectors(camPosHero, camPosCine, cineWeight);
      currentCamLook.lerpVectors(camLookHero, camLookCine, cineWeight);

      // Apply drag inertia with exponential friction decay
      dragOffset.x += dragVel.x;
      dragOffset.y += dragVel.y;
      dragVel.multiplyScalar(Math.exp(-8 * dt));
      if (!isDragging) {
        dragOffset.multiplyScalar(Math.exp(-4 * dt));
      }
      dragOffset.x = THREE.MathUtils.clamp(dragOffset.x, -0.6, 0.6);
      dragOffset.y = THREE.MathUtils.clamp(dragOffset.y, -0.4, 0.4);

      // Smooth camera parallax with physical spring inertia
      camParallax.lerp(camParallaxTarget, 1 - Math.exp(-6 * dt));
      lookParallax.lerp(lookParallaxTarget, 1 - Math.exp(-6 * dt));

      // Final camera placement combining scroll trajectory + interactive parallax + drag inertia
      camera.position.set(
        currentCamPos.x + camParallax.x + dragOffset.x * 0.45,
        currentCamPos.y + camParallax.y - dragOffset.y * 0.3,
        currentCamPos.z + camParallax.z
      );
      camera.lookAt(
        currentCamLook.x + lookParallax.x + dragOffset.x * 0.22,
        currentCamLook.y + lookParallax.y - dragOffset.y * 0.18,
        currentCamLook.z
      );

      // Smooth aim tracking
      aim.lerp(aimTarget, 1 - Math.exp(-10 * dt));
      spotTarget.position.copy(aim);

      // Spring physics for the hanging lamp:
      // When cineWeight = 1 (middle chapters), lamp lifts and pulls back into atmospheric background.
      // When cineWeight = 0 (top hero and bottom outro), lamp lowers back into front center focus!
      const lampLift = cineWeight * 0.65;
      lampTarget.set(
        LAMP_REST.x + (aim.x - AIM_DEFAULT.x) * SENSITIVITY.x,
        LAMP_REST.y + (aim.y - AIM_DEFAULT.y) * SENSITIVITY.y + lampLift,
        LAMP_REST.z + cineWeight * 0.25
      );

      // Spring force + damping
      const forceX = (lampTarget.x - lampPos.x) * 45;
      const forceY = (lampTarget.y - lampPos.y) * 45;
      lampVel.x += (forceX - lampVel.x * 6.5) * dt;
      lampVel.y += (forceY - lampVel.y * 6.5) * dt;
      lampPos.x += lampVel.x * dt;
      lampPos.y += lampVel.y * dt;

      lampGroup.position.copy(lampPos);

      // Orient lamp to face the spotlight aim point
      lampGroup.lookAt(aim.x, aim.y, aim.z);

      // Broaden spotlight slightly when scrolled into cinematic angle
      spotLight.angle = 0.58 + cineWeight * 0.14;
      spotLight.penumbra = 0.78 + cineWeight * 0.12;

      // Update wire connecting ceiling anchor to lamp
      const lampTop = lampPos.clone().add(new THREE.Vector3(0, 0, -0.22));
      wireMesh.position.copy(lampTop);
      const wireDelta = anchor.clone().sub(lampTop);
      const wireLength = wireDelta.length();
      wireMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), wireDelta.normalize());
      wireMesh.scale.set(1, wireLength, 1);

      // Update robot gaze if loaded
      if (robotMesh) {
        robotMesh.lookAt(aim.x, aim.y, aim.z);
      }

      // Volumetric cone animation
      coneUniforms.uTime.value = time;
      coneUniforms.uPower.value = isLit ? 1.0 - cineWeight * 0.35 : 0.05; // softly recedes into background

      // Dust particles drift
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (posAttr) {
        const positions = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3 + 1;
          const curY = positions[i3];
          if (curY !== undefined) {
            positions[i3] = curY + Math.sin(time * 1.4 + i) * 0.0012;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Light power - softens in middle chapters so room acts as subtle background
      const baseSpotIntensity = isLit ? (34 - cineWeight * 16) : 0.6;
      spotLight.intensity = baseSpotIntensity + Math.sin(time * 9) * 0.4;
      bulbPointLight.intensity = isLit ? (3.8 - cineWeight * 1.5) + Math.sin(time * 9) * 0.2 : 0.2;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      dracoLoader.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isLit]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      {/* Floating telemetry readout in bottom right */}
      <div className="absolute bottom-6 right-6 z-20 hidden sm:flex flex-col items-end gap-1.5 font-mono text-[11px] text-faint">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-faint">FOCUS</span>
          <span className="font-semibold text-ink">035%</span>
        </div>
        <div className="h-[2px] w-20 overflow-hidden bg-line">
          <div className="h-full w-[35%] bg-lit" />
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-faint">
          x {telemetry.x >= 0 ? ` ${telemetry.x}` : telemetry.x} &nbsp; y{' '}
          {telemetry.y >= 0 ? ` ${telemetry.y}` : telemetry.y} &nbsp; {telemetry.k}K
        </div>
      </div>
    </div>
  );
};

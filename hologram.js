import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

export class HologramAvatar {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.speaking = false;
    this.currentViseme = 'rest';
    this.mouse = new THREE.Vector2(0, 0);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x020714, 6, 18);

    this.camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.6, 6);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.addLights();
    this.buildAvatar();
    this.addFX();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  addLights() {
    const hemi = new THREE.HemisphereLight(0x76d3ff, 0x020c2b, 1.1);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0x6be7ff, 1.4);
    key.position.set(3, 6, 4);
    this.scene.add(key);

    const rim = new THREE.PointLight(0x49b5ff, 2, 18, 2);
    rim.position.set(-2, 2.5, -1.5);
    this.scene.add(rim);
  }

  hologramMaterial(opacity = 0.45) {
    return new THREE.MeshPhysicalMaterial({
      color: 0x6ed9ff,
      emissive: 0x2aa8ff,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.3
    });
  }

  buildAvatar() {
    this.avatarRoot = new THREE.Group();
    this.avatarRoot.position.y = -1.15;

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.68, 1.45, 10, 16), this.hologramMaterial(0.42));
    torso.position.y = 1.45;

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.2, 14), this.hologramMaterial(0.45));
    neck.position.y = 2.36;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 26, 26), this.hologramMaterial(0.45));
    head.position.y = 2.95;

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.35, 22, 16), this.hologramMaterial(0.38));
    jaw.position.set(0, 2.68, 0.15);
    jaw.scale.set(1.05, 0.68, 0.75);

    const eyeGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xb7f4ff });
    this.eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeL.position.set(-0.14, 2.98, 0.44);
    this.eyeR.position.set(0.14, 2.98, 0.44);

    this.mouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xd4ffff }));
    this.mouth.position.set(0, 2.76, 0.45);

    this.headGroup = new THREE.Group();
    this.headGroup.add(head, jaw, this.eyeL, this.eyeR, this.mouth);

    this.armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.05, 8, 10), this.hologramMaterial(0.33));
    this.armL.position.set(-0.9, 1.55, 0);
    this.armL.rotation.z = 0.22;

    this.armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.05, 8, 10), this.hologramMaterial(0.33));
    this.armR.position.set(0.9, 1.55, 0);
    this.armR.rotation.z = -0.22;

    const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.4, 8, 14), this.hologramMaterial(0.34));
    pelvis.position.y = 0.42;

    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.25, 8, 12), this.hologramMaterial(0.3));
    legL.position.set(-0.32, -0.7, 0);
    const legR = legL.clone();
    legR.position.x = 0.32;

    this.avatarRoot.add(torso, neck, this.headGroup, this.armL, this.armR, pelvis, legL, legR);

    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.03, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x62d7ff, transparent: true, opacity: 0.6 })
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -1.45;
    this.baseRing = baseRing;

    this.scene.add(this.avatarRoot, baseRing);
  }

  addFX() {
    const plane = new THREE.PlaneGeometry(5, 8, 1, 1);
    const shader = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          float scan = step(0.96, fract((vUv.y + time * 0.25) * 26.0));
          float glow = smoothstep(0.65, 0.0, abs(vUv.x - 0.5));
          float alpha = scan * 0.08 * glow;
          gl_FragColor = vec4(0.45, 0.88, 1.0, alpha);
        }
      `
    });

    this.scanPlane = new THREE.Mesh(plane, shader);
    this.scanPlane.position.set(0, 1.2, 1.45);
    this.scene.add(this.scanPlane);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
    });
  }

  setSpeaking(flag) {
    this.speaking = flag;
  }

  setViseme(viseme) {
    this.currentViseme = viseme;
  }

  animate() {
    const t = this.clock.getElapsedTime();

    const breathe = Math.sin(t * 1.25) * 0.025;
    this.avatarRoot.position.y = -1.15 + breathe;
    this.baseRing.scale.setScalar(1 + Math.sin(t * 2) * 0.02);

    const targetX = this.mouse.x * 0.22;
    const targetY = this.mouse.y * 0.12;
    this.headGroup.rotation.y += (targetX - this.headGroup.rotation.y) * 0.05;
    this.headGroup.rotation.x += (-targetY - this.headGroup.rotation.x) * 0.05;

    const blink = Math.max(0, Math.sin(t * 0.9 + 0.5) - 0.97) * 18;
    const eyeScale = 1 - Math.min(blink, 0.92);
    this.eyeL.scale.y = eyeScale;
    this.eyeR.scale.y = eyeScale;

    if (this.speaking) {
      this.armL.rotation.x = Math.sin(t * 3) * 0.25;
      this.armR.rotation.x = Math.sin(t * 3 + 1.2) * 0.25;
      this.baseRing.material.opacity = 0.75 + Math.sin(t * 8) * 0.08;
    } else {
      this.armL.rotation.x *= 0.9;
      this.armR.rotation.x *= 0.9;
      this.baseRing.material.opacity = 0.6;
    }

    const mouthMap = { rest: 0.05, A: 0.14, E: 0.1, O: 0.12, U: 0.1, M: 0.04 };
    const targetMouth = mouthMap[this.currentViseme] ?? 0.05;
    this.mouth.scale.y += (targetMouth / 0.05 - this.mouth.scale.y) * 0.28;

    this.scanPlane.material.uniforms.time.value = t;
    this.scanPlane.position.y = 1 + Math.sin(t * 0.45) * 0.16;

    if (Math.random() < 0.003) {
      this.avatarRoot.position.x = (Math.random() - 0.5) * 0.06;
    } else {
      this.avatarRoot.position.x *= 0.85;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

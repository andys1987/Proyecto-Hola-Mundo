import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

export class HologramAvatar {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.speaking = false;
    this.currentViseme = 'rest';
    this.mouse = new THREE.Vector2(0, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.4, 5.4);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.initLights();
    this.buildAvatar();
    this.buildParticles();
    this.bind();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initLights() {
    this.scene.add(new THREE.HemisphereLight(0x84e0ff, 0x050b1d, 1.1));
    const key = new THREE.DirectionalLight(0x79deff, 1.5); key.position.set(3, 4, 2); this.scene.add(key);
    this.pulseLight = new THREE.PointLight(0x46c7ff, 2, 22); this.pulseLight.position.set(0, 1.7, 1.2); this.scene.add(this.pulseLight);
  }

  holoMat(opacity = 0.45) {
    return new THREE.MeshPhysicalMaterial({ color: 0x8edfff, emissive: 0x2a9eff, emissiveIntensity: 1, transparent: true, opacity, roughness: 0.25, metalness: 0.08, clearcoat: 1 });
  }

  buildAvatar() {
    this.root = new THREE.Group();
    this.root.position.y = -1.2;

    const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 0.3, 8, 18), this.holoMat(0.36));
    shoulders.position.y = 2.08;
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.78, 1.5, 10, 22), this.holoMat(0.38)); torso.position.y = 1.2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.23, 20), this.holoMat(0.45)); neck.position.y = 2.63;

    this.headGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 26), this.holoMat(0.46));
    head.scale.set(0.95, 1.1, 0.92); head.position.y = 3.2;
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.35, 22, 18), this.holoMat(0.35)); jaw.position.set(0, 2.95, 0.12); jaw.scale.set(1.08, 0.7, 0.8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc7f6ff });
    this.eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), eyeMat); this.eyeL.position.set(-0.13, 3.23, 0.42);
    this.eyeR = this.eyeL.clone(); this.eyeR.position.x = 0.13;
    this.mouth = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.03), new THREE.MeshBasicMaterial({ color: 0xe2ffff })); this.mouth.position.set(0, 2.98, 0.42);
    this.headGroup.add(head, jaw, this.eyeL, this.eyeR, this.mouth);

    this.armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.05, 8, 12), this.holoMat(0.32)); this.armL.position.set(-1.05, 1.67, 0); this.armL.rotation.z = 0.25;
    this.armR = this.armL.clone(); this.armR.position.x = 1.05; this.armR.rotation.z = -0.25;
    const hand = new THREE.SphereGeometry(0.17, 12, 12);
    const handL = new THREE.Mesh(hand, this.holoMat(0.34)); handL.position.set(-1.2, 0.95, 0.08);
    const handR = handL.clone(); handR.position.x = 1.2;

    this.root.add(shoulders, torso, neck, this.headGroup, this.armL, this.armR, handL, handR);

    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.03, 8, 70), new THREE.MeshBasicMaterial({ color: 0x62dbff, transparent: true, opacity: 0.7 }));
    this.ring.rotation.x = Math.PI / 2; this.ring.position.y = -1.35;
    this.scene.add(this.root, this.ring);
  }

  buildParticles() {
    const count = 700;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 4 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0x7ceaff, size: 0.015, transparent: true, opacity: 0.55 });
    this.particles = new THREE.Points(g, m);
    this.scene.add(this.particles);
  }

  bind() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  setSpeaking(flag) { this.speaking = flag; }
  setViseme(v) { this.currentViseme = v; }

  animate() {
    const t = this.clock.getElapsedTime();
    this.root.position.y = -1.2 + Math.sin(t * 1.2) * 0.03;
    this.root.rotation.y = Math.sin(t * 0.38) * 0.08;

    this.headGroup.rotation.y += (this.mouse.x * 0.18 - this.headGroup.rotation.y) * 0.06;
    this.headGroup.rotation.x += (-this.mouse.y * 0.08 - this.headGroup.rotation.x) * 0.06;

    const blink = Math.max(0, Math.sin(t * 0.95 + 0.6) - 0.97) * 20;
    this.eyeL.scale.y = this.eyeR.scale.y = 1 - Math.min(0.92, blink);

    const mouthMap = { rest: 1, A: 2.8, E: 2.1, O: 2.4, U: 2.0, M: 0.8 };
    const target = mouthMap[this.currentViseme] ?? 1;
    this.mouth.scale.y += (target - this.mouth.scale.y) * 0.34;

    if (this.speaking) {
      this.armL.rotation.x = Math.sin(t * 3.6) * 0.22;
      this.armR.rotation.x = Math.sin(t * 3.6 + 1.4) * 0.22;
      this.pulseLight.intensity = 2.2 + Math.sin(t * 10.5) * 0.7;
      this.ring.scale.setScalar(1 + Math.sin(t * 8) * 0.03);
    } else {
      this.armL.rotation.x *= 0.9;
      this.armR.rotation.x *= 0.9;
      this.pulseLight.intensity = 1.9;
      this.ring.scale.setScalar(1);
    }

    this.particles.rotation.y += 0.0018;
    this.particles.position.y = Math.sin(t * 0.6) * 0.08;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

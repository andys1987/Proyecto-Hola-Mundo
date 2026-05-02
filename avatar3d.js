import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

export class Avatar3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.camera = new THREE.PerspectiveCamera(34, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.55, 3.2);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.mixer = null;
    this.avatar = null;
    this.headBone = null;
    this.mouthMesh = null;
    this.speaking = false;
    this.level = 0;
    this.mouse = new THREE.Vector2();

    this.initLights();
    this.initFX();
    this.loadAvatar();
    this.bind();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initLights() {
    this.scene.add(new THREE.HemisphereLight(0x8be7ff, 0x071020, 1.2));
    const key = new THREE.DirectionalLight(0x8fd8ff, 1.8); key.position.set(2.3, 4, 2); this.scene.add(key);
    this.pulseLight = new THREE.PointLight(0x42c9ff, 2.2, 12, 2); this.pulseLight.position.set(0, 1.5, 1); this.scene.add(this.pulseLight);
  }

  initFX() {
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.018, 8, 64), new THREE.MeshBasicMaterial({ color: 0x6de8ff, transparent: true, opacity: 0.6 }));
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.05;
    this.scene.add(this.ring);

    const points = new Float32Array(1200);
    for (let i = 0; i < 400; i++) {
      points[i * 3] = (Math.random() - 0.5) * 3;
      points[i * 3 + 1] = Math.random() * 2.8;
      points[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x79e6ff, size: 0.013, transparent: true, opacity: 0.55 }));
    this.scene.add(this.particles);
  }

  loadAvatar() {
    const loader = new GLTFLoader();
    const src = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb';

    loader.load(src, (gltf) => {
      this.avatar = gltf.scene;
      this.avatar.position.set(0, 0, 0);
      this.avatar.scale.setScalar(1.18);
      this.scene.add(this.avatar);

      this.avatar.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = new THREE.MeshPhysicalMaterial({
            color: 0x8ce5ff,
            transparent: true,
            opacity: 0.42,
            emissive: 0x2aa3ff,
            emissiveIntensity: 0.75,
            roughness: 0.24,
            metalness: 0.05,
            clearcoat: 1,
            clearcoatRoughness: 0.18
          });
          if (!this.mouthMesh && obj.morphTargetInfluences) this.mouthMesh = obj;
        }
        if (!this.headBone && obj.isBone && /head/i.test(obj.name)) this.headBone = obj;
      });

      if (gltf.animations?.length) {
        this.mixer = new THREE.AnimationMixer(this.avatar);
        this.mixer.clipAction(gltf.animations[0]).play();
      }
    });
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
  setAudioLevel(v) { this.level = THREE.MathUtils.clamp(v, 0, 1); }
  applyViseme(value) {
    if (!this.mouthMesh || !this.mouthMesh.morphTargetInfluences) return;
    for (let i = 0; i < this.mouthMesh.morphTargetInfluences.length; i++) this.mouthMesh.morphTargetInfluences[i] = 0;
    this.mouthMesh.morphTargetInfluences[0] = value;
  }

  animate() {
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    this.mixer?.update(dt);

    if (this.avatar) {
      this.avatar.position.y = Math.sin(t * 1.2) * 0.03;
      this.avatar.rotation.y = Math.sin(t * 0.35) * 0.06;
    }
    if (this.headBone) {
      this.headBone.rotation.y += (this.mouse.x * 0.16 - this.headBone.rotation.y) * 0.08;
      this.headBone.rotation.x += (-this.mouse.y * 0.08 - this.headBone.rotation.x) * 0.08;
      if (this.speaking) this.headBone.rotation.x += Math.sin(t * 6) * 0.01;
    }

    const pulse = this.speaking ? 1 + this.level * 0.9 : 1;
    this.pulseLight.intensity = 2 + pulse;
    this.ring.scale.setScalar(1 + this.level * 0.08 + Math.sin(t * 7) * 0.01);
    this.particles.rotation.y += 0.0016;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

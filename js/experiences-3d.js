(function () {
  "use strict";

  const MODEL_URL = "assets/medieval-weapons/model.dae";
  const TEXTURE_BASE = "assets/medieval-weapons/textures/";

  const MATERIAL_FILES = {
    "2h_sword": "2h_sword",
    spear: "spear",
    shield: "shield",
    "1h_mace": "1h_mace",
    cleaver_002: "cleaver.002",
    axe_2h: "axe_2h",
  };

  const NODE_MATERIAL = {
    sword_2h: "2h_sword",
    spear_explode: "spear",
    shield_lp: "shield",
    "1h_mace_lp": "1h_mace",
    cleaver: "cleaver_002",
    axe_2h: "axe_2h",
  };

  let state = null;

  function resolveMaterialName(mesh) {
    const directName = mesh.material && mesh.material.name;
    if (directName && MATERIAL_FILES[directName]) {
      return directName;
    }

    if (NODE_MATERIAL[mesh.name]) {
      return NODE_MATERIAL[mesh.name];
    }

    if (mesh.parent && NODE_MATERIAL[mesh.parent.name]) {
      return NODE_MATERIAL[mesh.parent.name];
    }

    return directName || null;
  }

  function buildMaterial(materialName, textureLoader) {
    const prefix = materialName ? MATERIAL_FILES[materialName] : null;
    if (!prefix) {
      return new THREE.MeshStandardMaterial({
        color: 0xb8b0a4,
        metalness: 0.75,
        roughness: 0.42,
      });
    }

    const albedo = textureLoader.load(`${TEXTURE_BASE}${prefix}_albedo.jpg`);
    albedo.encoding = THREE.sRGBEncoding;

    return new THREE.MeshStandardMaterial({
      map: albedo,
      normalMap: textureLoader.load(`${TEXTURE_BASE}${prefix}_normal.jpg`),
      metalnessMap: textureLoader.load(`${TEXTURE_BASE}${prefix}_metallic.jpg`),
      roughnessMap: textureLoader.load(`${TEXTURE_BASE}${prefix}_roughness.jpg`),
      metalness: 1,
      roughness: 1,
    });
  }

  function resizeRenderer(currentState) {
    const parent = currentState.canvas.parentElement;
    if (!parent) return false;

    const width = Math.max(parent.clientWidth, 1);
    const height = Math.max(parent.clientHeight, 1);

    if (width < 2 || height < 2) return false;

    currentState.renderer.setSize(width, height, false);
    currentState.camera.aspect = width / height;
    currentState.camera.updateProjectionMatrix();
    return true;
  }

  function fitModelToView(model, camera) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const targetSize = 6.0;
    model.scale.setScalar(targetSize / maxDim);
    model.position.y -= targetSize * 0.24;

    const fov = camera.fov * (Math.PI / 180);
    const fitDistance = targetSize / (2 * Math.tan(fov / 2));
    camera.position.set(0, model.position.y + targetSize * 0.04, fitDistance * 0.9);
    camera.lookAt(0, model.position.y, 0);
  }

  function renderFrame() {
    if (!state) return;

    if (state.pivot && !state.userDragging) {
      state.pivot.rotation.y += 0.0016;
    }

    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  }

  function loadCollada(url) {
    return new Promise(function (resolve, reject) {
      const loader = new THREE.ColladaLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }

  function mountExperiences3D(canvas, statusEl) {
    if (state) {
      return Promise.resolve(state);
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x0a0c10, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    scene.add(new THREE.AmbientLight(0xf4eedb, 0.42));

    const keyLight = new THREE.DirectionalLight(0xfff0d4, 1.15);
    keyLight.position.set(2.8, 4.5, 3.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8eb4ff, 0.38);
    rimLight.position.set(-3.5, 1.8, -2.6);
    scene.add(rimLight);

    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.92;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);

    state = {
      renderer: renderer,
      scene: scene,
      camera: camera,
      controls: controls,
      pivot: null,
      canvas: canvas,
      animationId: null,
      resizeObserver: null,
      userDragging: false,
      onResize: function () {
        resizeRenderer(state);
        renderFrame();
      },
    };

    controls.addEventListener("start", function () {
      state.userDragging = true;
    });

    controls.addEventListener("end", function () {
      state.userDragging = false;
    });

    resizeRenderer(state);
    renderFrame();

    if (statusEl) {
      statusEl.textContent = "Načítám 3D model…";
      statusEl.hidden = false;
    }

    const textureLoader = new THREE.TextureLoader();

    return loadCollada(MODEL_URL)
      .then(function (collada) {
        const model = collada.scene;

        model.traverse(function (child) {
          if (!child.isMesh) return;

          const materialName = resolveMaterialName(child);
          child.material = buildMaterial(materialName, textureLoader);
        });

        fitModelToView(model, camera);

        const pivot = new THREE.Group();
        pivot.add(model);
        scene.add(pivot);
        state.pivot = pivot;
        controls.update();

        if (statusEl) {
          statusEl.hidden = true;
        }

        if (window.ResizeObserver) {
          state.resizeObserver = new ResizeObserver(function () {
            state.onResize();
          });
          state.resizeObserver.observe(canvas.parentElement);
        } else {
          window.addEventListener("resize", state.onResize);
        }

        resizeRenderer(state);
        renderFrame();
        return state;
      })
      .catch(function (error) {
        state = null;
        throw error;
      });
  }

  function startExperiences3D() {
    if (!state) return;

    resizeRenderer(state);
    renderFrame();

    if (state.animationId) return;

    function animate() {
      state.animationId = requestAnimationFrame(animate);
      renderFrame();
    }

    animate();
  }

  function stopExperiences3D() {
    if (!state || !state.animationId) return;
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  function resizeExperiences3D() {
    if (!state) return;
    state.onResize();
  }

  function disposeExperiences3D() {
    stopExperiences3D();

    if (!state) return;

    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
    } else {
      window.removeEventListener("resize", state.onResize);
    }

    state.controls.dispose();
    state.renderer.dispose();
    state = null;
  }

  window.HorniHradExperiences3D = {
    mountExperiences3D: mountExperiences3D,
    startExperiences3D: startExperiences3D,
    stopExperiences3D: stopExperiences3D,
    resizeExperiences3D: resizeExperiences3D,
    disposeExperiences3D: disposeExperiences3D,
  };
})();

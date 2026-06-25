const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const POINTS = [
  { s: 0, i: 0, x: 48, y: 48 },
  { s: 0, i: 1, x: 300, y: 48 },
  { s: 0, i: 2, x: 552, y: 48 },
  { s: 1, i: 0, x: 126, y: 126 },
  { s: 1, i: 1, x: 300, y: 126 },
  { s: 1, i: 2, x: 474, y: 126 },
  { s: 2, i: 0, x: 204, y: 204 },
  { s: 2, i: 1, x: 300, y: 204 },
  { s: 2, i: 2, x: 396, y: 204 },
  { s: 3, i: 0, x: 48, y: 300 },
  { s: 3, i: 1, x: 126, y: 300 },
  { s: 3, i: 2, x: 204, y: 300 },
  { s: 3, i: 3, x: 396, y: 300 },
  { s: 3, i: 4, x: 474, y: 300 },
  { s: 3, i: 5, x: 552, y: 300 },
  { s: 4, i: 0, x: 204, y: 396 },
  { s: 4, i: 1, x: 300, y: 396 },
  { s: 4, i: 2, x: 396, y: 396 },
  { s: 5, i: 0, x: 126, y: 474 },
  { s: 5, i: 1, x: 300, y: 474 },
  { s: 5, i: 2, x: 474, y: 474 },
  { s: 6, i: 0, x: 48, y: 552 },
  { s: 6, i: 1, x: 300, y: 552 },
  { s: 6, i: 2, x: 552, y: 552 },
];

const MILL_DEFS = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[3, 0], [3, 1], [3, 2]],
  [[3, 3], [3, 4], [3, 5]],
  [[4, 0], [4, 1], [4, 2]],
  [[5, 0], [5, 1], [5, 2]],
  [[6, 0], [6, 1], [6, 2]],
  [[0, 0], [3, 0], [6, 0]],
  [[1, 0], [3, 1], [5, 0]],
  [[2, 0], [3, 2], [4, 0]],
  [[2, 2], [3, 3], [4, 2]],
  [[1, 2], [3, 4], [5, 2]],
  [[0, 2], [3, 5], [6, 2]],
].map((mill) => mill.map(([s, i]) => ({ s, i })));

function keyOf(point) {
  return `${point.s}:${point.i}`;
}

const POINT_BY_KEY = new Map(POINTS.map((point) => [keyOf(point), point]));

export async function createParkTableScene(host, handlers = {}) {
  const THREE = await import(THREE_URL);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8d8ef);
  scene.fog = new THREE.Fog(0xa8d8ef, 16, 48);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 90);
  const cameraTarget = new THREE.Vector3(0, 0.2, 0);
  camera.position.set(0, 8.4, 9.6);
  camera.lookAt(cameraTarget);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();

  const materials = makeMaterials(THREE);
  const boardGroup = new THREE.Group();
  const parkGroup = new THREE.Group();
  const pointGroups = new Map();
  const pieceGroups = new Map();
  const clickTargets = [];
  const invalidAnimations = [];
  const endParticles = [];
  let endAnimation = null;
  let lastBoard = null;

  scene.add(parkGroup, boardGroup);
  addLights(THREE, scene);
  addPark(THREE, parkGroup, materials);
  addTable(THREE, parkGroup, materials);
  addBoardLines(THREE, boardGroup, materials);
  addBoardPoints(THREE, boardGroup, materials, pointGroups, clickTargets);

  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  function handlePointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects(clickTargets, false)[0];
    if (!hit) return;

    const { s, i } = hit.object.userData;
    handlers.onPointClick?.({ s, i });
  }

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);

  function update(state) {
    updateBoardPoints(THREE, pointGroups, materials, state);
    updatePieces(THREE, boardGroup, materials, pieceGroups, state.board, lastBoard);
    lastBoard = state.board.map((row) => [...row]);
  }

  function playImpossibleMove(point) {
    invalidAnimations.push({
      key: keyOf(point),
      start: performance.now(),
      duration: 620,
    });
  }

  function resetEndAnimation() {
    endAnimation = null;
    for (const particle of endParticles.splice(0)) {
      particle.parent?.remove(particle);
      disposeObject(THREE, particle);
    }
    scene.fog.color.set(0xa8d8ef);
    scene.background.set(0xa8d8ef);
  }

  function playEndAnimation(outcome) {
    resetEndAnimation();
    endAnimation = {
      outcome,
      start: performance.now(),
    };

    if (outcome === "win") createWinParticles(THREE, boardGroup, materials, endParticles);
    else if (outcome === "lose") createLoseParticles(THREE, boardGroup, materials, endParticles);
    else createDrawParticles(THREE, boardGroup, materials, endParticles);
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    const now = performance.now();

    animatePark(parkGroup, elapsed);
    animateBoardPoints(pointGroups, elapsed);
    animatePieces(pieceGroups, elapsed);
    animateInvalidMoves(pointGroups, pieceGroups, invalidAnimations, now);
    animateEnd(THREE, scene, endAnimation, endParticles, now);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  return {
    update,
    playImpossibleMove,
    playEndAnimation,
    resetEndAnimation,
    dispose() {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      host.removeChild(renderer.domElement);
      renderer.dispose();
    },
  };
}

function makeMaterials(THREE) {
  return {
    grass: new THREE.MeshStandardMaterial({ color: 0x6ead5f, roughness: 0.94 }),
    path: new THREE.MeshStandardMaterial({ color: 0xc9b890, roughness: 0.9 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x7b4f2f, roughness: 0.88 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f8f4b, roughness: 0.78 }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x6fa842, roughness: 0.78 }),
    tableTop: new THREE.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.72, metalness: 0.02 }),
    tableEdge: new THREE.MeshStandardMaterial({ color: 0x5a3924, roughness: 0.84 }),
    boardLine: new THREE.MeshStandardMaterial({ color: 0x263722, roughness: 0.52 }),
    boardLineGlow: new THREE.MeshStandardMaterial({ color: 0xe3c56b, roughness: 0.46, emissive: 0x1b1200 }),
    emptyPoint: new THREE.MeshStandardMaterial({ color: 0xf4f2d7, roughness: 0.58 }),
    selectedPoint: new THREE.MeshStandardMaterial({ color: 0xffc857, roughness: 0.38, emissive: 0x7a4c00 }),
    legalPoint: new THREE.MeshStandardMaterial({ color: 0xf2d06b, roughness: 0.36, emissive: 0x3f2600 }),
    capturePoint: new THREE.MeshStandardMaterial({ color: 0xf06a4e, roughness: 0.4, emissive: 0x4a0d05 }),
    human: new THREE.MeshStandardMaterial({ color: 0xd9573f, roughness: 0.42, metalness: 0.04 }),
    humanTop: new THREE.MeshStandardMaterial({ color: 0xffaa91, roughness: 0.35, metalness: 0.05 }),
    ai: new THREE.MeshStandardMaterial({ color: 0x0f8a8a, roughness: 0.42, metalness: 0.04 }),
    aiTop: new THREE.MeshStandardMaterial({ color: 0x8ee3dc, roughness: 0.35, metalness: 0.05 }),
    invisible: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    gold: new THREE.MeshStandardMaterial({ color: 0xffd95a, roughness: 0.35, emissive: 0x4e3100 }),
    ember: new THREE.MeshStandardMaterial({ color: 0xff4f3d, roughness: 0.4, emissive: 0x5c0800 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x537071, roughness: 0.58, transparent: true, opacity: 0.82 }),
  };
}

function addLights(THREE, scene) {
  scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x547a3f, 1.9));

  const sun = new THREE.DirectionalLight(0xfff4cf, 3.2);
  sun.position.set(-6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  const warm = new THREE.PointLight(0xffd06b, 1.1, 11);
  warm.position.set(0, 3.2, 1.6);
  scene.add(warm);
}

function addPark(THREE, group, materials) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), materials.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.35;
  ground.receiveShadow = true;
  group.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(9, 34), materials.path);
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = 0.45;
  path.position.set(-8, -1.335, -4);
  path.receiveShadow = true;
  group.add(path);

  const treePositions = [
    [-9, -10, 1.1],
    [8.5, -8, 0.9],
    [-11, 6, 1],
    [10, 5.5, 1.2],
    [-5, 12, 0.8],
    [13, 13, 1.05],
  ];

  for (const [x, z, scale] of treePositions) {
    const tree = makeTree(THREE, materials, scale);
    tree.position.set(x, -1.35, z);
    tree.rotation.y = (x + z) * 0.13;
    group.add(tree);
  }
}

function makeTree(THREE, materials, scale) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 2.1 * scale, 10), materials.bark);
  trunk.position.y = 1.05 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const canopyA = new THREE.Mesh(new THREE.SphereGeometry(0.95 * scale, 18, 12), materials.leaf);
  canopyA.position.set(0, 2.42 * scale, 0);
  canopyA.castShadow = true;
  tree.add(canopyA);

  const canopyB = new THREE.Mesh(new THREE.SphereGeometry(0.74 * scale, 16, 10), materials.leaf2);
  canopyB.position.set(0.48 * scale, 2.15 * scale, 0.22 * scale);
  canopyB.castShadow = true;
  tree.add(canopyB);

  tree.userData.sway = Math.random() * 100;
  return tree;
}

function addTable(THREE, group, materials) {
  const top = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.34, 8.8), materials.tableTop);
  top.position.y = -0.02;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const lip = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.25, 9.1), materials.tableEdge);
  lip.position.y = -0.24;
  lip.castShadow = true;
  lip.receiveShadow = true;
  group.add(lip);

  const legGeometry = new THREE.BoxGeometry(0.34, 2.3, 0.34);
  for (const x of [-3.9, 3.9]) {
    for (const z of [-3.9, 3.9]) {
      const leg = new THREE.Mesh(legGeometry, materials.tableEdge);
      leg.position.set(x, -1.35, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }
}

function boardToWorld(THREE, point, y = 0.25) {
  const scale = 7.05;
  return new THREE.Vector3(((point.x - 300) / 600) * scale, y, ((point.y - 300) / 600) * scale);
}

function addBoardLines(THREE, group, materials) {
  const segments = new Map();
  for (const mill of MILL_DEFS) {
    for (let i = 0; i < mill.length - 1; i++) {
      const a = POINT_BY_KEY.get(keyOf(mill[i]));
      const b = POINT_BY_KEY.get(keyOf(mill[i + 1]));
      const key = [keyOf(a), keyOf(b)].sort().join("|");
      segments.set(key, [a, b]);
    }
  }

  for (const [a, b] of segments.values()) {
    const start = boardToWorld(THREE, a, 0.29);
    const end = boardToWorld(THREE, b, 0.29);
    const line = cylinderBetween(THREE, start, end, 0.035, materials.boardLine);
    line.castShadow = true;
    line.receiveShadow = true;
    group.add(line);
  }
}

function addBoardPoints(THREE, group, materials, pointGroups, clickTargets) {
  for (const point of POINTS) {
    const base = boardToWorld(THREE, point, 0.34);
    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(base);
    nodeGroup.userData.base = base.clone();
    nodeGroup.userData.key = keyOf(point);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.08, 28), materials.emptyPoint);
    pad.castShadow = true;
    pad.receiveShadow = true;
    pad.userData.pad = true;
    nodeGroup.add(pad);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.022, 8, 32), materials.boardLine);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.048;
    ring.userData.ring = true;
    nodeGroup.add(ring);

    const target = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.16, 24), materials.invisible);
    target.position.y = 0.08;
    target.userData = { s: point.s, i: point.i };
    clickTargets.push(target);
    nodeGroup.add(target);

    pointGroups.set(keyOf(point), nodeGroup);
    group.add(nodeGroup);
  }
}

function cylinderBetween(THREE, start, end, radius, material) {
  const delta = new THREE.Vector3().subVectors(end, start);
  const length = delta.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 14), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return mesh;
}

function updateBoardPoints(THREE, pointGroups, materials, state) {
  const selected = state.selected ? keyOf(state.selected) : "";
  const legal = new Set(state.legalTargets.map(keyOf));
  const capture = new Set(state.captureTargets.map(keyOf));

  for (const [key, group] of pointGroups) {
    const pad = group.children.find((child) => child.userData.pad);
    const ring = group.children.find((child) => child.userData.ring);
    const isSelected = key === selected;
    const isLegal = legal.has(key);
    const isCapture = capture.has(key);

    if (isCapture) pad.material = materials.capturePoint;
    else if (isSelected) pad.material = materials.selectedPoint;
    else if (isLegal) pad.material = materials.legalPoint;
    else pad.material = materials.emptyPoint;

    ring.material = isLegal || isCapture || isSelected ? materials.boardLineGlow : materials.boardLine;
    group.userData.highlight = isSelected || isLegal || isCapture;
  }
}

function updatePieces(THREE, boardGroup, materials, pieceGroups, board, previousBoard) {
  const needed = new Set();

  for (const point of POINTS) {
    const value = board[point.s][point.i];
    if (value !== "X" && value !== "O") continue;

    const key = keyOf(point);
    needed.add(key);
    const existing = pieceGroups.get(key);

    if (!existing || existing.userData.kind !== value) {
      if (existing) {
        boardGroup.remove(existing);
        disposeObject(THREE, existing);
      }

      const piece = makePiece(THREE, materials, value);
      const base = boardToWorld(THREE, point, 0.54);
      piece.position.copy(base);
      piece.userData.base = base.clone();
      piece.userData.kind = value;
      piece.userData.spawn = performance.now();
      piece.scale.setScalar(0.04);
      pieceGroups.set(key, piece);
      boardGroup.add(piece);
    } else {
      existing.userData.base = boardToWorld(THREE, point, 0.54);
    }
  }

  for (const [key, piece] of [...pieceGroups]) {
    if (!needed.has(key)) {
      pieceGroups.delete(key);
      boardGroup.remove(piece);
      disposeObject(THREE, piece);
    }
  }

  void previousBoard;
}

function makePiece(THREE, materials, kind) {
  const group = new THREE.Group();
  const bodyMaterial = kind === "X" ? materials.human : materials.ai;
  const topMaterial = kind === "X" ? materials.humanTop : materials.aiTop;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.18, 32), bodyMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 14), topMaterial);
  crown.scale.y = 0.55;
  crown.position.y = 0.17;
  crown.castShadow = true;
  crown.receiveShadow = true;
  group.add(crown);

  return group;
}

function animatePark(group, elapsed) {
  for (const child of group.children) {
    if (!child.userData.sway) continue;
    const sway = Math.sin(elapsed * 0.65 + child.userData.sway) * 0.018;
    child.rotation.z = sway;
  }
}

function animateBoardPoints(pointGroups, elapsed) {
  for (const group of pointGroups.values()) {
    const pulse = group.userData.highlight ? 1 + Math.sin(elapsed * 5) * 0.045 : 1;
    group.scale.set(pulse, 1, pulse);
  }
}

function animatePieces(pieceGroups, elapsed) {
  const now = performance.now();
  for (const piece of pieceGroups.values()) {
    piece.position.copy(piece.userData.base);
    const spawnProgress = Math.min(1, (now - piece.userData.spawn) / 280);
    const pop = easeOutBack(spawnProgress);
    const idle = 1 + Math.sin(elapsed * 2.2 + piece.userData.base.x) * 0.012;
    piece.scale.setScalar(Math.max(0.04, pop * idle));
  }
}

function animateInvalidMoves(pointGroups, pieceGroups, invalidAnimations, now) {
  for (const group of pointGroups.values()) {
    group.position.copy(group.userData.base);
  }

  for (let i = invalidAnimations.length - 1; i >= 0; i--) {
    const animation = invalidAnimations[i];
    const progress = (now - animation.start) / animation.duration;

    if (progress >= 1) {
      invalidAnimations.splice(i, 1);
      continue;
    }

    const strength = (1 - progress) * Math.sin(progress * Math.PI * 9) * 0.16;
    const node = pointGroups.get(animation.key);
    const piece = pieceGroups.get(animation.key);
    if (node) node.position.x += strength;
    if (piece) piece.position.x += strength;
  }
}

function createWinParticles(THREE, group, materials, particles) {
  const palette = [materials.gold, materials.humanTop, materials.aiTop];
  for (let i = 0; i < 90; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.03), palette[i % palette.length]);
    mesh.position.set((Math.random() - 0.5) * 6.2, 1.4 + Math.random() * 2.2, (Math.random() - 0.5) * 6.2);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.018, 0.018 + Math.random() * 0.022, (Math.random() - 0.5) * 0.018);
    mesh.userData.spin = new THREE.Vector3(Math.random() * 0.08, Math.random() * 0.08, Math.random() * 0.08);
    particles.push(mesh);
    group.add(mesh);
  }
}

function createLoseParticles(THREE, group, materials, particles) {
  for (let i = 0; i < 64; i++) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.58, 6), materials.rain);
    mesh.position.set((Math.random() - 0.5) * 7, 2.4 + Math.random() * 3.2, (Math.random() - 0.5) * 7);
    mesh.rotation.z = 0.22;
    mesh.userData.velocity = new THREE.Vector3(-0.006, -0.045 - Math.random() * 0.035, 0.004);
    particles.push(mesh);
    group.add(mesh);
  }
}

function createDrawParticles(THREE, group, materials, particles) {
  for (let i = 0; i < 36; i++) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.14 + Math.random() * 0.12, 0.012, 8, 20), materials.gold);
    mesh.position.set((Math.random() - 0.5) * 5.8, 0.9 + Math.random() * 1.8, (Math.random() - 0.5) * 5.8);
    mesh.rotation.x = Math.PI / 2;
    mesh.userData.velocity = new THREE.Vector3(0, 0.006 + Math.random() * 0.012, 0);
    mesh.userData.spin = new THREE.Vector3(0, 0, 0.025 + Math.random() * 0.04);
    particles.push(mesh);
    group.add(mesh);
  }
}

function animateEnd(THREE, scene, endAnimation, particles, now) {
  if (!endAnimation) return;

  const elapsed = (now - endAnimation.start) / 1000;
  if (endAnimation.outcome === "lose") {
    scene.background.lerp(new THREE.Color(0x6b8b8b), 0.025);
    scene.fog.color.lerp(new THREE.Color(0x6b8b8b), 0.025);
  } else if (endAnimation.outcome === "win") {
    scene.background.lerp(new THREE.Color(0xb7e5f3), 0.015);
    scene.fog.color.lerp(new THREE.Color(0xb7e5f3), 0.015);
  }

  for (const particle of particles) {
    particle.position.add(particle.userData.velocity);
    if (particle.userData.spin) {
      particle.rotation.x += particle.userData.spin.x || 0;
      particle.rotation.y += particle.userData.spin.y || 0;
      particle.rotation.z += particle.userData.spin.z || 0;
    }

    if (endAnimation.outcome === "win") {
      particle.userData.velocity.y -= 0.0009;
      if (particle.position.y < 0.5 && elapsed > 2.5) particle.position.y = 3 + Math.random() * 2;
    }

    if (endAnimation.outcome === "lose" && particle.position.y < 0.2) {
      particle.position.y = 3.2 + Math.random() * 2.8;
    }
  }
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function disposeObject(THREE, object) {
  object.traverse?.((child) => {
    if (child.geometry) child.geometry.dispose();
  });
  void THREE;
}

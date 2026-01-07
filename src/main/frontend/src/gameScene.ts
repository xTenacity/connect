import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import AssetManager from './assetManager.js';
import { Board } from './board.js';

const COLS = 7; //change this to be dynamic later
const ROWS = 6; //change this to be dynamic later
const CELL_SIZE = 1; // world units per cell
const BOARD_WIDTH = COLS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;
const PIECE_SCALE = 0.3; // adjustable scale for piece size

export default class GameScene {
    container: HTMLElement;
        //rendering
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    raycaster: THREE.Raycaster;
        //visuals
    boardMesh!: THREE.Mesh | null;
    hoverMesh: THREE.Mesh | null;
    hoverTargetX: number;
    hoverTargetY: number;
    pointerOverBoard: boolean;
        //game logic
    board: Board;
    currentPlayer: 'X' | 'O';
    rankedHints: any[];
    activeDrops: any[];
        //asset management
    assetManager: AssetManager;

     constructor(container: HTMLElement) {
         //initialize three.js scene
         this.container = container;
         this.scene = new THREE.Scene();
         this.raycaster = new THREE.Raycaster();

        // add dark background and some lights
        this.scene.background = new THREE.Color(0x0b1320);
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        // directional light, hemisphere
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
        this.scene.add(hemi);

        // main sunlight (strong directional light to add shadows)
        const dir = new THREE.DirectionalLight(0xffffff, 2);
        dir.position.set(4.5, 12, 6);
        dir.castShadow = true;

        // configure shadow camera for the board area
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        dir.shadow.camera.near = 0.5;
        dir.shadow.camera.far = 50;

        // expand orthographic shadow camera to cover the board
        if (dir.shadow?.camera) {
            try {
                dir.shadow.camera.left = -BOARD_WIDTH;
                dir.shadow.camera.right = BOARD_WIDTH;
                dir.shadow.camera.top = BOARD_HEIGHT;
                dir.shadow.camera.bottom = -BOARD_HEIGHT;
                dir.shadow.bias = -0.001;
            } catch (e) {
                console.warn('Could not configure shadow camera', e);
            }
        }

        // point the light at the board center
        const dirTarget = new THREE.Object3D();
        dirTarget.position.set(0, 0, 0); //are these technically magic numbers?
        this.scene.add(dirTarget);
        dir.target = dirTarget;
        this.scene.add(dir);

         // PerspectiveCamera adds parallax and depth
        const fov = 60;
        const aspect = (container.clientWidth || 800) / (container.clientHeight || 600);
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);

        // place the camera facing the  board
        this.camera.position.set(0, 1.2, 8.2);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);

        // enable physically-correct lighting & filmic tone mapping for nicer shading
        this.renderer.toneMapping = (THREE as any).ACESFilmicToneMapping || (THREE as any).ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1;

        // ensure correct color output (sRGB)
        try {
            this.renderer.outputColorSpace = (THREE as any).SRGBColorSpace;
        } catch (e) {
            console.warn('Could not set outputColorSpace', e);
        }
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.top = '0';
        this.renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
        this.renderer.setClearColor(0x111111, 1);

        // enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        //set instance variables
        this.board = new Board(COLS, ROWS);
        this.assetManager = new AssetManager();
        this.hoverMesh = null;
        this.hoverTargetX = 0;
        this.hoverTargetY = (BOARD_HEIGHT / 2) + CELL_SIZE * 0.5; // hover starts above the board
        this.pointerOverBoard = false;
        this.currentPlayer = 'X';
        this.rankedHints = [];
        this.activeDrops = [];

        // input handlers
        globalThis.addEventListener('mousemove', (e: MouseEvent) =>
            this.onPointerMove(e));
        globalThis.addEventListener('mousedown', (e: MouseEvent) =>
            this.onPointerDown(e));
        globalThis.addEventListener('resize', () =>
            this.resize());

        // setup orbit controls (panning enabled)
        this.setupControls().catch((e) =>
            console.warn('setupControls failed', e));

        this.animate();

        // development debug helpers if requested via URL parameter (?debug=true)
        try {
            if (
                typeof globalThis !== 'undefined' &&
                (globalThis as any).window?.location &&
                typeof (globalThis as any).window.location.search === 'string'
            ) {
                if ((globalThis as any).window.location.search.includes('debug=true')) {
                    // schedule async helper to avoid doing async work in constructor (no clue what this means)
                    setTimeout(() => {
                        this.enableDebugHelpers().catch((e) =>
                            console.warn('enableDebugHelpers failed', e));
                        }, 0);
                }
            }
        } catch (e) { console.warn('Debug helper check failed', e); }
    }

    // create and enable OrbitControls so the user can pan/rotate the camera
    async setupControls() {
        try {
            const mod = await import('three/examples/jsm/controls/OrbitControls');
            const OrbitControls = (mod as any).OrbitControls;
            const controls = new OrbitControls(this.camera, this.renderer.domElement);
            controls.enablePan = true;
            controls.enableRotate = true;
            controls.enableZoom = true;
            // prefer panning with middle mouse / touch
            controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.PAN,
                RIGHT: THREE.MOUSE.PAN
            };

            // limit polar angle so camera doesn't go below board too much
            controls.minPolarAngle = 0.2;
            controls.maxPolarAngle = Math.PI / 2.1;

            // limit distance you can zoom in/out
            controls.minDistance = 4.0;
            controls.maxDistance = 20.0;
            controls.target.set(0, 0, 0);
            controls.update();
            (this as any)._controls = controls;
        } catch (e) {
            console.warn('Could not load OrbitControls', e);
        }
    }

    // Dynamically import OrbitControls to avoid bundling it in production main chunk.
    async enableDebugHelpers() {
        try {
            const mod = await import('three/examples/jsm/controls/OrbitControls');
            const OrbitControls = (mod as any).OrbitControls;
            const controls = new OrbitControls(this.camera, this.renderer.domElement);
            controls.target.set(0, 0, 0);
            controls.update();
            (this as any)._controls = controls;
            // add small helpers
            const axes = new THREE.AxesHelper(2);
            const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
            this.scene.add(axes, grid);
        } catch (e) {
            console.warn('Could not load debug helpers', e);
        }
    }

    // Public async initializer to be called after construction
    async init() {
        try {
            // request models as well so 3D piece glb files are loaded if present
            await this.loadAssetsSimple({ includeModels: true });
        } catch (e) {
            console.warn('Asset load failed (continuing with placeholders)', e);
        }
        this.buildBoardMesh();
        this.createHoverMesh();
        this.updatePieces();
    }

    // Simplified asset loader: loads images into textures if possible, but never rejects
    async loadAssetsSimple(opts?: { includeModels?: boolean }) {
        const list = this.assetManager.getAssetList(opts);
        const texLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();

        const tasks: Promise<void>[] = [];
        for (const a of list) {
            if (a.type === 'image') {
                const p = new Promise<void>((res) => {
                    texLoader.load(
                        a.url,
                        (tex: any) => { (this as any)[`tex_${a.key}`] = tex;
                            try { tex.colorSpace = 'srgb'; } catch(e) {}
                            try { tex.needsUpdate = true; } catch(e) {}
                            res(); },
                        undefined,
                        () => { (this as any)[`tex_${a.key}`] = null; res(); }
                    );
                });
                tasks.push(p);
            } else if (a.type === 'gltf') {
                const p = new Promise<void>((res) => {
                    gltfLoader.load(a.url, (gltf: any) => {
                        // ensure loaded models cast/receive shadows and are reasonably scaled
                        const scene = gltf.scene || gltf;
                        scene.traverse((n: any) => {
                            if (n.isMesh) {
                                n.castShadow = true;
                                n.receiveShadow = true;
                                if (!n.material || n.material instanceof THREE.MeshBasicMaterial) {
                                    n.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
                                }
                            }
                        });
                        (this as any)[`model_${a.key}`] = scene;
                        res();
                    }, undefined, () => { res(); });
                });
                tasks.push(p);
            }
            // audio / other types skipped for now (non-critical)
        }
        await Promise.all(tasks);
    }

    buildBoardMesh() {
        // PlaneGeometry default is in X-Y plane (normal +Z) which is perfect for an upright board.
        const boardGeom = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.85, metalness: 0.02, side: (THREE as any).DoubleSide });
        const boardMesh = new THREE.Mesh(boardGeom, boardMat);
        // keep the plane upright (no rotation)
        boardMesh.position.set(0, 0, 0);
        boardMesh.receiveShadow = true;
        boardMesh.userData = { isBoard: true };
        this.scene.add(boardMesh);
        this.boardMesh = boardMesh;

        // cells now live in X (cols) and Y (rows) on the plane, with a small z offset so they appear in front
        const cellGeom = new THREE.CircleGeometry(CELL_SIZE * 0.35, 32);
        const cellMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.6, metalness: 0.01 });
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cx = (c - (COLS - 1) / 2) * CELL_SIZE;
                // convert row index to Y coordinate (top row has largest positive Y)
                const cy = ((ROWS - 1) / 2 - r) * CELL_SIZE;
                const m = new THREE.Mesh(cellGeom, cellMat);
                m.position.set(cx, cy, 0.02);
                m.receiveShadow = true;
                this.scene.add(m);
            }
        }
    }

    createHoverMesh() {
        const geom = new THREE.CircleGeometry(CELL_SIZE * 0.35, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xfdd835, transparent: true, opacity: 0.95, roughness: 0.5, side: (THREE as any).DoubleSide });
        this.hoverMesh = new THREE.Mesh(geom, mat);
        // upright circle facing camera, place slightly in front of the board
        this.hoverMesh.position.set(0, this.hoverTargetY, 0.05);
        this.hoverMesh.userData = { isHover: true };
        this.hoverMesh.visible = false;
        this.scene.add(this.hoverMesh);
    }

    onPointerMove(e: MouseEvent) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        // Use raycaster to intersect the board mesh robustly (avoids division by zero when camera is rotated)
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
        const hits = this.boardMesh ? this.raycaster.intersectObject(this.boardMesh, false) : [];
        if (hits && hits.length > 0) {
            const hit = hits[0];
            const pos = hit.point;
            this.pointerOverBoard = true;
            const localX = THREE.MathUtils.clamp(pos.x, -BOARD_WIDTH / 2 + CELL_SIZE / 2, BOARD_WIDTH / 2 - CELL_SIZE / 2);
            const col = Math.floor((localX + BOARD_WIDTH / 2) / CELL_SIZE);
            this.hoverTargetX = (col - (COLS - 1) / 2) * CELL_SIZE;
            // hover sits slightly above the top of the board (so it looks like a piece ready to drop)
            this.hoverTargetY = (BOARD_HEIGHT / 2) + CELL_SIZE * 0.5;
            if (this.hoverMesh) this.hoverMesh.visible = true;
        } else {
            this.pointerOverBoard = false;
            if (this.hoverMesh) this.hoverMesh.visible = false;
        }
    }

    onPointerDown(e: MouseEvent) {
        // Only react to primary (left) button and only if no modifier keys are held.
        if (e.button !== 0) return;
        if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

        // Only allow drops when pointer is actually over the board (prevents panning outside the board from making moves)
        if (!this.pointerOverBoard) return;

        // Use raycaster to determine the clicked position on the board instead of manual camera math
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
        const hits = this.boardMesh ? this.raycaster.intersectObject(this.boardMesh, false) : [];
        if (!hits || hits.length === 0) return;
        const pos = hits[0].point;
        if (pos.x < -BOARD_WIDTH/2 || pos.x > BOARD_WIDTH/2 || pos.y < -BOARD_HEIGHT/2 || pos.y > BOARD_HEIGHT/2) return;
        const col = Math.floor((THREE.MathUtils.clamp(pos.x, -BOARD_WIDTH/2 + CELL_SIZE/2, BOARD_WIDTH/2 - CELL_SIZE/2) + BOARD_WIDTH/2) / CELL_SIZE);
         if (col < 0 || col >= COLS) return;
         const row = this.getRowForCol(col);
         if (row === null) return;

        this.board.drop(col, this.currentPlayer);
        const color = this.currentPlayer === 'X' ? 0xfdd835 : 0xd32f2f;
        const geom = new THREE.CircleGeometry(CELL_SIZE * 0.35, 32);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.06 });
        const dropMesh = new THREE.Mesh(geom, mat);
        // upright piece (faces camera). start high above the board and drop down in Y
        const cx = (col - (COLS - 1) / 2) * CELL_SIZE;
        const targetY = ((ROWS - 1) / 2 - row) * CELL_SIZE;
        const startY = (BOARD_HEIGHT / 2) + 1.2;
        dropMesh.position.set(cx, startY, 0.06);
        dropMesh.userData = { isDropping: true, col, row };
        dropMesh.castShadow = true;
        this.scene.add(dropMesh);
        this.activeDrops.push({ mesh: dropMesh, targetY: targetY + 0.01, speed: 0.02 });

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        // If we switched to the AI player, request an AI move so the method is used and single-player works
        if (this.currentPlayer === 'O') {
            // fire-and-forget AI move
            void this.requestAIMove();
        }
    }

    getRowForCol(col: number): number | null {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.board.board[r][col] === '_') return r;
        }
        return null;
    }

    updatePieces() {
        const toRemove: any[] = [];
        this.scene.traverse((obj: any) => { if (obj?.userData?.isPiece) toRemove.push(obj); });
        toRemove.forEach(o => { this.scene.remove(o); });

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const val = this.board.board[r][c];
                if (val === '_') continue;

                // try model first
                const modelKey = `model_piece-${val.toLowerCase()}`;
                const model = (this as any)[modelKey];
                const cx = (c - (COLS - 1) / 2) * CELL_SIZE;
                const cy = ((ROWS - 1) / 2 - r) * CELL_SIZE;
                if (model) {
                    const instance = model.clone(true);
                    const scale = CELL_SIZE * PIECE_SCALE;
                    instance.scale.set(scale, scale, scale);
                    // Rotate to lie flat on the upright board
                    instance.rotation.x = Math.PI / 2;
                    // determine bounding box to place model so its bottom sits on the board
                    const pieceColor = val === 'X' ? 0xfdd835 : 0xd32f2f;
                     const bbox = new THREE.Box3().setFromObject(instance);
                     const minZ = bbox.min.z ?? 0;
                     // translate so minZ becomes small offset above board
                     instance.position.set(cx, cy, -minZ + 0.06);
                      // ensure meshes within the gltf instance cast/receive shadows
                     instance.traverse((n: any) => {
                         if (n.isMesh) {
                             n.castShadow = true; n.receiveShadow = true;
                             try { if (n.material && 'color' in n.material) { n.material.color.setHex(pieceColor); n.material.side = (THREE as any).DoubleSide; n.material.needsUpdate = true; } } catch(e) {}
                         }
                     });
                      // add a simple blob shadow under the piece to create depth
                      const shadowGeom = new THREE.CircleGeometry(CELL_SIZE * 0.45, 32);
                      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
                      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
                      shadowMesh.position.set(cx, cy, 0.055);
                      shadowMesh.userData = { isPiece: true, isShadow: true };
                      this.scene.add(shadowMesh);
                      instance.userData = { isPiece: true };
                      this.scene.add(instance);
                      continue;
                }

                const texKey = `tex_piece-${val.toLowerCase()}`;
                const tex = (this as any)[texKey];
                if (tex) {
                    const planeGeom = new THREE.PlaneGeometry(CELL_SIZE * 0.7, CELL_SIZE * 0.7);
                    // use MeshStandardMaterial so the texture reacts to lighting/shadows
                    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, metalness: 0.02, roughness: 0.65, side: (THREE as any).DoubleSide });
                    const m = new THREE.Mesh(planeGeom, mat);
                    // Ensure the textured plane faces the same way as the board (flip if the texture appears upside-down)
                    m.rotation.z = 0; // adjust to Math.PI if your textures appear inverted
                    m.position.set(cx, cy, 0.06);
                    m.userData = { isPiece: true };
                    m.castShadow = false;
                    m.receiveShadow = true;
                      // add a subtle shadow under the textured plane
                      const shadowGeom = new THREE.CircleGeometry(CELL_SIZE * 0.45, 32);
                      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
                      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
                      shadowMesh.position.set(cx, cy - 0.01, 0.055);
                      shadowMesh.userData = { isPiece: true, isShadow: true };
                      this.scene.add(shadowMesh);
                      this.scene.add(m);
                  } else {
                      const piece3d = this.createProceduralPiece(val as 'X'|'O');
                      // position procedural piece so it sits on top of the board
                      piece3d.position.set(cx, cy, 0.06);
                     // color procedural piece explicitly
                     try { (piece3d.material as any).color.setHex(val === 'X' ? 0xfdd835 : 0xd32f2f); } catch(e) {}
                      // add a soft shadow under the procedural piece
                      const shadowGeom = new THREE.CircleGeometry(CELL_SIZE * 0.45, 32);
                      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
                      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
                      shadowMesh.position.set(cx, cy, 0.055);
                      shadowMesh.userData = { isPiece: true, isShadow: true };
                      this.scene.add(shadowMesh);
                      this.scene.add(piece3d);
                  }
              }
          }
      }

    // Helper to create a simple 3D piece when no GLTF model exists
    createProceduralPiece(val: 'X'|'O') {
        const color = val === 'X' ? 0xfdd835 : 0xd32f2f;
        const geom = new THREE.CylinderGeometry(CELL_SIZE * 0.32 * PIECE_SCALE, CELL_SIZE * 0.32 * PIECE_SCALE, CELL_SIZE * 0.2 * PIECE_SCALE, 24);
        const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.45 });
        const mesh = new THREE.Mesh(geom, mat);
        // Rotate to lie flat on the upright board
        mesh.rotation.x = Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { isPiece: true };
        return mesh;
    }

    async requestAIMove() {
        const payload = { board: this.board.board, aiPiece: 'O', aiDepth: 4, mistakeRate: 0.1, aiName: 'ServerAI' };
        try {
            const resp = await fetch('/api/ai/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            if (data?.rankedMoves) this.showRankedMoveHints(data.rankedMoves);
            if (typeof data?.move === 'number' && data.move >= 0) {
                this.board.drop(data.move, 'O');
                this.updatePieces();
            }
        } catch (e) { console.error('AI request failed', e); }
        this.currentPlayer = 'X';
    }

    showRankedMoveHints(rankedMoves: any[]) {
        this.rankedHints.forEach(h => this.scene.remove(h));
        this.rankedHints = [];
        for (let i = 0; i < Math.min(3, rankedMoves.length); i++) {
            const rm = rankedMoves[i];
            const col = rm.move;
            const cx = (col - (COLS - 1) / 2) * CELL_SIZE;
            const geom = new THREE.CircleGeometry(CELL_SIZE * 0.28 * (1 - i*0.12), 32);
            const colors = [0xfdd835, 0xb0bec5, 0xffab91];
            const mat = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.85 - i*0.15 });
            const m = new THREE.Mesh(geom, mat);
            m.position.set(cx, (BOARD_HEIGHT / 2) + CELL_SIZE * 0.25, 0.05);
            this.scene.add(m);
            this.rankedHints.push(m);
        }
    }

    resize() {
        const w = Math.max(1, Math.floor(this.container.clientWidth));
        const h = Math.max(1, Math.floor(this.container.clientHeight));
        const dpr = window.devicePixelRatio || 1;
        this.renderer.setSize(w, h, false);
        this.renderer.setPixelRatio(dpr);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        // update perspective camera aspect
        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        } else {
            // Keep compatibility if some other camera type is used
            try { this.camera.updateProjectionMatrix(); } catch (e) { /* ignore */ }
        }
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        if (!(this as any).__firstFrameLogged) {
            (this as any).__firstFrameLogged = true;
            // log some info about the canvas if available; use optional chaining to avoid exceptions
            console.log('First render frame — canvas (client):', this.renderer?.domElement?.clientWidth, this.renderer?.domElement?.clientHeight, 'canvas (px):', this.renderer?.domElement?.width, this.renderer?.domElement?.height);
        }

        if (this.activeDrops.length > 0) {
            for (let i = this.activeDrops.length - 1; i >= 0; i--) {
                const a = this.activeDrops[i];
                const mesh = a.mesh;
                // dropping along Y axis for upright board
                mesh.position.y = Math.max(a.targetY, mesh.position.y - a.speed);
                a.speed += 0.0015;
                if (mesh.position.y <= a.targetY + 0.001) {
                    this.scene.remove(mesh);
                    this.activeDrops.splice(i, 1);
                    this.updatePieces();
                }
            }
        }

        if (this.hoverMesh) {
            this.hoverMesh.position.x += (this.hoverTargetX - this.hoverMesh.position.x) * 0.15;
            this.hoverMesh.position.y += (this.hoverTargetY - this.hoverMesh.position.y) * 0.15;
        }
        const t = performance.now() / 300;
        for (let i = 0; i < this.rankedHints.length; i++) {
            const h = this.rankedHints[i];
            h.position.y = (BOARD_HEIGHT / 2) + CELL_SIZE * 0.25 + Math.sin(t + i) * 0.03;
        }
        // update controls if present
        try { (this as any)._controls?.update(); } catch (e) {}
        this.renderer.render(this.scene, this.camera);
    }

}


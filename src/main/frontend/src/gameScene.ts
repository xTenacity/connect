import * as THREE from 'three';
import type { Object3D, Texture } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import AssetManager from './assetManager.js';
import { Board } from './board.js';

// When three's types are not available or cause resolution issues in this setup,
// fall back to 'any' for these local aliases so compilation doesn't fail.
type ThreeObject3D = any;
type ThreeTexture = any;

const COLS = 7;
const ROWS = 6;
const CELL_SIZE = 1; // world units per cell
const BOARD_WIDTH = COLS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;

export default class GameScene {
    container: HTMLElement;
    scene: any; // THREE.Scene at runtime; typed as any to avoid requiring @types/three
    camera: any; // THREE.OrthographicCamera
    renderer: any; // THREE.WebGLRenderer
    board: Board;
    assetManager: AssetManager;
    hoverMesh: any; // THREE.Mesh (nullable at runtime)
    hoverTargetX: number;
    hoverTargetZ: number;
    currentPlayer: 'X' | 'O';
    rankedHints: any[]; // THREE.Object3D[]
    activeDrops: any[]; // track pieces currently dropping visually

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        // add basic lighting so 3D pieces (MeshStandardMaterial) are visible
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(5, 10, 5);
        dir.castShadow = false;
        this.scene.add(dir);

        // Orthographic camera sized to board
        const viewWidth = BOARD_WIDTH + 2;
        const viewHeight = BOARD_HEIGHT + 2;
        this.camera = new THREE.OrthographicCamera(
            -viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 0.1, 100
        );
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        // set pixel ratio for sharpness on HiDPI displays
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        // Make canvas fill its container explicitly and be visible
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.outline = '1px solid rgba(255,0,0,0.2)';
        this.renderer.domElement.style.zIndex = '1';
        // position canvas above other content and make sure it actually overlays the container
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.top = '0';

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        // set a dark clear color (avoid white flash on some platforms)
        this.renderer.setClearColor(0x111111, 1);
        container.appendChild(this.renderer.domElement);
        // ensure sizes and projection are set based on actual layout
        this.resize();

        // Debug: log container and canvas sizes and WebGL availability
        try {
            console.log('GameScene init — container rect', container.getBoundingClientRect());
            console.log('Canvas size (client) after append', this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight);
            const gl = (this.renderer.getContext && this.renderer.getContext()) || null;
            console.log('WebGL context available:', !!gl);
            if (this.renderer.domElement.clientWidth === 0 || this.renderer.domElement.clientHeight === 0) {
                console.warn('Renderer canvas has zero size; calling resize() after a short delay');
                setTimeout(() => this.resize(), 50);
            }
        } catch (err) {
            console.warn('Error while logging renderer state', err);
        }

        // Ensure container has visible background and minimum size so canvas is visible
        try {
            if (!container.style.backgroundColor) container.style.backgroundColor = '#111111';
            if (!container.style.minWidth) container.style.minWidth = '400px';
            if (!container.style.minHeight) container.style.minHeight = '300px';
            container.style.position = container.style.position || 'relative';
        } catch (e) { console.log("ermm failed")
        }

        // Add a simple debug cube and grid so we can confirm rendering even before assets load
        try {
            const testGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const testMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
            const testCube = new THREE.Mesh(testGeom, testMat);
            testCube.position.set(0, 0.25, 0);
            this.scene.add(testCube);

            const grid = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
            // align grid on XZ plane for top-down view (use same orientation as other meshes)
            grid.rotation.x = -Math.PI / 2;
            this.scene.add(grid);
            console.log('Debug visuals (cube + grid) added to scene');
        } catch (e) {
            console.warn('Failed to add debug visuals', e);
        }

        this.board = new Board(COLS, ROWS);
        this.assetManager = new AssetManager('act1');
        this.hoverMesh = null;
        this.hoverTargetX = 0;
        this.hoverTargetZ = 0;
        this.currentPlayer = 'X';
        this.rankedHints = [];
        this.activeDrops = [];

        // Start loading assets (textures / audio) and then build scene visuals
        this.loadAssets().then(() => {
            this.buildBoardMesh();
            this.createHoverMesh();
            this.updatePieces();
        }).catch((e) => {
            console.warn('Asset loading failed or partially failed', e);
            // fall back to building UI so the app remains usable
            this.buildBoardMesh();
            this.createHoverMesh();
            this.updatePieces();
        });

        // Input
        globalThis.addEventListener('mousemove', (e: MouseEvent) => this.onPointerMove(e));
        globalThis.addEventListener('mousedown', (e: MouseEvent) => this.onPointerDown(e));
        globalThis.addEventListener('resize', () => this.resize());

        this.animate();
    }

    // New: asset loading helper that logs each item
    async loadAssets() {
        const list = this.assetManager.getAssetList();
        const texLoader = new THREE.TextureLoader();
        const audioLoader = new THREE.AudioLoader();
        const gltfLoader = new GLTFLoader();
        const promises: Promise<void>[] = [];

        const makePlaceholderTexture = (colorHex: number) => {
            // create small canvas with circular piece graphic as fallback
            const size = 128;
            const cvs = document.createElement('canvas');
            cvs.width = size; cvs.height = size;
            const ctx = cvs.getContext('2d')!;
            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
            ctx.beginPath();
            ctx.arc(size/2, size/2, size*0.38, 0, Math.PI*2);
            ctx.fill();
            // return THREE texture
            const tex = new THREE.CanvasTexture(cvs);
            tex.needsUpdate = true;
            return tex;
        };

        for (const a of list) {
            console.log(`Queuing asset -> key=${a.key} type=${a.type} url=${a.url}`);
            if (a.type === 'gltf') {
                const p = new Promise<void>((res) => {
                    // Normalize key so updatePieces can find it -> model_piece-x
                    const baseKey = (a.key || '').replace(/-model$/, '');
                    gltfLoader.load(a.url,
                        (gltf: any) => {
                            console.log(`Loaded model -> key=${a.key} url=${a.url}`);
                            // store under model_<baseKey>
                            (this as any)[`model_${baseKey}`] = gltf.scene;
                            res();
                        },
                        undefined,
                        (err: any) => {
                            console.warn(`Model load failed for ${a.url}, will fallback to other assets if available`, err);
                            res();
                        }
                    );
                });
                promises.push(p);
            } else if (a.type === 'image') {
                const p = new Promise<void>(async (res) => {
                    try {
                        // Try fetching the image first to get HTTP status and more informative logging
                        const r = await fetch(a.url);
                        console.log(`Fetch response for ${a.url}: ${r.status} ${r.statusText}`);
                        if (!r.ok) {
                            console.error(`Fetch failed for ${a.url}: ${r.status}`);
                            // create a placeholder texture so rendering doesn't break
                            const fallbackColor = a.key.includes('x') ? 0xfdd835 : 0xd32f2f;
                            (this as any)[`tex_${a.key}`] = makePlaceholderTexture(fallbackColor);
                            res();
                            return;
                        }

                        const blob = await r.blob();
                        console.log(`Blob for ${a.url}: type=${blob.type} size=${blob.size}`);

                        // If the blob looks invalid, create placeholder texture
                        if (blob.size === 0 || !blob.type.startsWith('image')) {
                            console.warn(`Invalid/empty image blob for ${a.url}, using placeholder texture`);
                            const fallbackColor = a.key.includes('x') ? 0xfdd835 : 0xd32f2f;
                            (this as any)[`tex_${a.key}`] = makePlaceholderTexture(fallbackColor);
                            res();
                            return;
                        }

                        const blobUrl = URL.createObjectURL(blob);
                        texLoader.load(
                            blobUrl,
                            (tex: ThreeTexture) => {
                                console.log(`Loaded asset -> key=${a.key} url=${a.url}`);
                                (this as any)[`tex_${a.key}`] = tex;
                                URL.revokeObjectURL(blobUrl);
                                res();
                            },
                            undefined,
                            (err: any) => {
                                console.error(`Load error: key=${a.key} type=image url=${a.url}`, err);
                                URL.revokeObjectURL(blobUrl);
                                // fallback
                                const fallbackColor = a.key.includes('x') ? 0xfdd835 : 0xd32f2f;
                                (this as any)[`tex_${a.key}`] = makePlaceholderTexture(fallbackColor);
                                res();
                            }
                        );
                    } catch (fetchErr) {
                        console.error(`Fetch error for ${a.url}`, fetchErr);
                        // fallback texture
                        const fallbackColor = a.key.includes('x') ? 0xfdd835 : 0xd32f2f;
                        (this as any)[`tex_${a.key}`] = makePlaceholderTexture(fallbackColor);
                        res();
                    }
                });
                promises.push(p);
            } else if (a.type === 'audio') {
                const p = new Promise<void>((res) => {
                    audioLoader.load(a.url,
                        (buffer: any) => {
                            console.log(`Loaded asset -> key=${a.key} url=${a.url}`);
                            (this as any)[`audio_${a.key}`] = buffer;
                            res();
                        },
                        undefined,
                        (err: any) => {
                            console.error(`Load error: key=${a.key} type=audio url=${a.url}`, err);
                            res();
                        }
                    );
                });
                promises.push(p);
            } else {
                console.warn('Unknown asset type', a.type, a);
            }
        }
        await Promise.all(promises);
        console.log('Asset loading complete.');
    }

    buildBoardMesh() {
        // board plane
        const boardGeom = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
        const boardMat = new THREE.MeshBasicMaterial({ color: 0x1976d2 });
        const boardMesh = new THREE.Mesh(boardGeom, boardMat);
        boardMesh.rotation.x = -Math.PI / 2; // lay flat
        this.scene.add(boardMesh);

        // cells (holes)
        const cellGeom = new THREE.CircleGeometry(CELL_SIZE * 0.35, 32);
        const cellMat = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cx = (c - (COLS - 1) / 2) * CELL_SIZE;
                const cz = (r - (ROWS - 1) / 2) * CELL_SIZE;
                const m = new THREE.Mesh(cellGeom, cellMat);
                m.position.set(cx, 0.01, cz);
                m.rotation.x = -Math.PI / 2;
                this.scene.add(m);
            }
        }
    }

    createHoverMesh() {
        const geom = new THREE.CircleGeometry(CELL_SIZE * 0.35, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xfdd835, transparent: true, opacity: 0.95 });
        this.hoverMesh = new THREE.Mesh(geom, mat);
        this.hoverMesh.rotation.x = -Math.PI / 2;
        this.hoverMesh.position.set(0, 0.05, - (BOARD_HEIGHT / 2) - CELL_SIZE);
        this.scene.add(this.hoverMesh);
    }

    onPointerMove(e: MouseEvent) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        // project to world plane at y=0
        const vec = new THREE.Vector3(x, y, 0.5).unproject(this.camera);
        // ray from camera to plane
        const dir = vec.sub(this.camera.position).normalize();
        const distance = -this.camera.position.y / dir.y;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        // clamp to board
        const localX = THREE.MathUtils.clamp(pos.x, -BOARD_WIDTH / 2 + CELL_SIZE / 2, BOARD_WIDTH / 2 - CELL_SIZE / 2);
        // snap to column center and set hover target directly
        const col = Math.floor((localX + BOARD_WIDTH / 2) / CELL_SIZE);
        this.hoverTargetX = (col - (COLS - 1) / 2) * CELL_SIZE;
        this.hoverTargetZ = - (BOARD_HEIGHT / 2) - CELL_SIZE * 0.45; // above the board
    }

    onPointerDown(_e: MouseEvent) {
        // compute column from hoverTargetX
        const col = Math.round((this.hoverTargetX / CELL_SIZE) + (COLS - 1) / 2);
        if (col < 0 || col >= COLS) return;
        const row = this.getRowForCol(col);
        if (row === null) return;

        // update game state immediately
        this.board.drop(col, this.currentPlayer);

        // create a visual dropping piece; it will be removed when animation finishes
        const color = this.currentPlayer === 'X' ? 0xfdd835 : 0xd32f2f;
        const geom = new THREE.CircleGeometry(CELL_SIZE * 0.35, 32);
        const mat = new THREE.MeshBasicMaterial({ color });
        const dropMesh = new THREE.Mesh(geom, mat);
        dropMesh.rotation.x = -Math.PI / 2;
        const cx = (col - (COLS - 1) / 2) * CELL_SIZE;
        const targetZ = (row - (ROWS - 1) / 2) * CELL_SIZE;
        // start above the board
        dropMesh.position.set(cx, 1.2, targetZ);
        dropMesh.userData = { isDropping: true };
        this.scene.add(dropMesh);

        // add to active drops with targetY and speed
        this.activeDrops.push({ mesh: dropMesh, targetY: 0.02, speed: 0.02 });

        // switch player and request AI if needed
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        if (this.currentPlayer === 'O') {
            setTimeout(() => this.requestAIMove(), 300);
        }
    }

    getRowForCol(col: number): number | null {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.board.board[r][col] === '_') return r;
        }
        return null;
    }

    updatePieces() {
        // clear old piece objects (only those marked as isPiece)
        const toRemove: any[] = [];
        this.scene.traverse((obj: any) => { if (obj?.userData?.isPiece) toRemove.push(obj); });
        toRemove.forEach(o => { this.scene.remove(o); });

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const val = this.board.board[r][c];
                if (val === '_') continue;

                const modelKey = `model_piece-${val.toLowerCase()}`;
                const model = (this as any)[modelKey] as ThreeObject3D | undefined;
                if (model) {
                    const instance = model.clone(true);
                    const scale = CELL_SIZE * 0.6;
                    instance.scale.set(scale, scale, scale);
                    const cx = (c - (COLS - 1) / 2) * CELL_SIZE;
                    const cz = (r - (ROWS - 1) / 2) * CELL_SIZE;
                    instance.position.set(cx, 0.02, cz);
                    (instance as any).userData = { isPiece: true };
                    this.scene.add(instance);
                    continue;
                }

                // If texture is available, use it on a plane; otherwise simple circle mesh
                const texKey = `tex_piece-${val.toLowerCase()}`;
                const tex = (this as any)[texKey] as ThreeTexture | undefined;
                if (tex) {
                    const planeGeom = new THREE.PlaneGeometry(CELL_SIZE * 0.7, CELL_SIZE * 0.7);
                    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
                    const m = new THREE.Mesh(planeGeom, mat);
                    const cx = (c - (COLS - 1) / 2) * CELL_SIZE;
                    const cz = (r - (ROWS - 1) / 2) * CELL_SIZE;
                    m.position.set(cx, 0.02, cz);
                    m.rotation.x = -Math.PI / 2;
                    (m as any).userData = { isPiece: true };
                    this.scene.add(m);
                } else {
                    // create a small 3D cylinder piece when no texture/model is available
                    const piece3d = this.createProceduralPiece(val as 'X'|'O');
                    const cx = (c - (COLS - 1) / 2) * CELL_SIZE;
                    const cz = (r - (ROWS - 1) / 2) * CELL_SIZE;
                    piece3d.position.set(cx, 0.02, cz);
                    this.scene.add(piece3d);
                }
            }
        }
    }

    // Helper to create a simple 3D piece when no GLTF model exists
    createProceduralPiece(val: 'X'|'O') {
        const color = val === 'X' ? 0xfdd835 : 0xd32f2f;
        const geom = new THREE.CylinderGeometry(CELL_SIZE * 0.32, CELL_SIZE * 0.32, CELL_SIZE * 0.2, 24);
        const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.6 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.x = -Math.PI / 2; // orient flat on board
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (mesh as any).userData = { isPiece: true };
        return mesh;
    }

    async requestAIMove() {
        const payload = { board: this.board.board, aiPiece: 'O', aiDepth: 4, mistakeRate: 0.1, aiName: 'ServerAI' };
        console.log('Requesting AI move', payload);
        try {
            const resp = await fetch('/api/ai/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            console.log('AI response', data);
            if (data?.rankedMoves) this.showRankedMoveHints(data.rankedMoves);
            if (typeof data?.move === 'number' && data.move >= 0) {
                this.board.drop(data.move, 'O');
                this.updatePieces();
            }
        } catch (e) { console.error('AI request failed', e); }
        this.currentPlayer = 'X';
    }

    showRankedMoveHints(rankedMoves: any[]) {
        // clear old hints
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
            m.rotation.x = -Math.PI / 2;
            m.position.set(cx, 0.05, - (BOARD_HEIGHT / 2) - CELL_SIZE*0.45);
            this.scene.add(m);
            this.rankedHints.push(m);
        }
    }

    resize() {
        // Use devicePixelRatio-aware sizing and ensure non-zero pixel dimensions
        const w = Math.max(1, Math.floor(this.container.clientWidth));
        const h = Math.max(1, Math.floor(this.container.clientHeight));
        const dpr = window.devicePixelRatio || 1;
        this.renderer.setSize(w, h, false);
        this.renderer.setPixelRatio(dpr);
        // keep DOM canvas stretched to container
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        // update camera frustum in case aspect changed (keep orthographic centered)
        const viewWidth = BOARD_WIDTH + 2;
        const viewHeight = BOARD_HEIGHT + 2;
        this.camera.left = -viewWidth / 2;
        this.camera.right = viewWidth / 2;
        this.camera.top = viewHeight / 2;
        this.camera.bottom = -viewHeight / 2;
        this.camera.updateProjectionMatrix();
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        // on first frame, print a one-time diagnostic
        if (!(this as any).__firstFrameLogged) {
            (this as any).__firstFrameLogged = true;
            console.log('First render frame — canvas (client):', this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight, 'canvas (px):', this.renderer.domElement.width, this.renderer.domElement.height);
            try {
                const gl = (this.renderer.getContext && this.renderer.getContext()) || null;
                console.log('GL context info exists:', !!gl);
            } catch (e) { /* ignore */ }
            try { console.log('Scene children count on first frame:', this.scene.children.length); } catch (e) { }
        }

        // process active drop animations
        if (this.activeDrops.length > 0) {
            for (let i = this.activeDrops.length - 1; i >= 0; i--) {
                const a = this.activeDrops[i];
                const mesh = a.mesh;
                // simple ease: move down by speed, accelerate a bit
                mesh.position.y = Math.max(a.targetY, mesh.position.y - a.speed);
                a.speed += 0.0015; // small acceleration
                if (mesh.position.y <= a.targetY + 0.001) {
                    // drop finished
                    this.scene.remove(mesh);
                    this.activeDrops.splice(i, 1);
                    // re-render final pieces (adds the landed piece visuals)
                    this.updatePieces();
                }
            }
        }

        // lerp hover
        if (this.hoverMesh) {
            this.hoverMesh.position.x += (this.hoverTargetX - this.hoverMesh.position.x) * 0.15;
            this.hoverMesh.position.z += (this.hoverTargetZ - this.hoverMesh.position.z) * 0.15;
        }
        // simple bob for hints
        const t = performance.now() / 300;
        for (let i = 0; i < this.rankedHints.length; i++) {
            const h = this.rankedHints[i];
            h.position.y = 0.05 + Math.sin(t + i) * 0.03;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

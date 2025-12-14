export type ActName = 'act1' | 'act2' | 'act3';

const BASE = '/assets'; // served from src/main/resources/static/assets
export const AVAILABLE_ACTS: ActName[] = ['act1', 'act2', 'act3'];

// Map logical act names to actual folder names present in resources/static
const ACT_FOLDER_MAP: Record<ActName, string> = {
    act1: 'act_i',
    act2: 'act_ii',
    act3: 'act_iii'
};

export default class AssetManager {
    act: ActName;
    constructor(act: ActName = 'act1') {
        this.act = act;
    }

    setAct(act: ActName) {
        this.act = act;
    }

    private folderForAct() {
        return ACT_FOLDER_MAP[this.act] || this.act;
    }

    getMusicPath(filename: string) {
        return `${BASE}/${this.folderForAct()}/music/${filename}`;
    }

    getSpritePath(filename: string) {
        return `${BASE}/${this.folderForAct()}/sprites/${filename}`;
    }

    getModelPath(filename: string) {
        return `${BASE}/${this.folderForAct()}/models/${filename}`;
    }

    getSharedPath(subpath: string) {
        return `${BASE}/shared/${subpath}`;
    }

    // Return an array describing assets (key,type,url) — caller decides how to load
    getAssetList() {
        return [
            // Skip GLTF models by default to avoid 404 when models folder/files are not present.
            { key: 'piece-x', type: 'image', url: this.getSpritePath('piece_x.png') },
            { key: 'piece-o', type: 'image', url: this.getSpritePath('piece_o.png') },
            { key: 'act-music-1', type: 'audio', url: this.getMusicPath('beginnersluck.ogg') }
        ];
    }
}

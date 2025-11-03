export type ActName = 'act1' | 'act2' | 'act3';

const BASE = '/assets'; // served from src/main/resources/static/assets
export const AVAILABLE_ACTS: ActName[] = ['act1', 'act2', 'act3'];

export default class AssetManager {
    act: ActName;
    constructor(act: ActName = 'act1') {
        this.act = act;
    }

    setAct(act: ActName) {
        this.act = act;
    }

    getMusicPath(filename: string) {
        return `${BASE}/${this.act}/music/${filename}`;
    }

    getSpritePath(filename: string) {
        return `${BASE}/${this.act}/sprites/${filename}`;
    }

    getSharedPath(subpath: string) {
        return `${BASE}/shared/${subpath}`;
    }

    // Queue assets for Phaser loader and log each queued item
    // Returns the array of attempted assets so caller can track status
    loadActAssets(loader: any) {
        // Define assets to attempt to load (key, type, url)
        const assets = [
            { key: 'piece-x', type: 'image', url: this.getSpritePath('piece_x.png') },
            { key: 'piece-o', type: 'image', url: this.getSpritePath('piece_o.png') },
            { key: 'ui-sprite', type: 'image', url: this.getSharedPath('ui/ui.png') },
            { key: 'act-music-1', type: 'audio', url: this.getMusicPath('beginner_luck.ogg') }
        ];

        for (const a of assets) {
            try {
                console.log(`Queuing asset -> key=${a.key} type=${a.type} url=${a.url}`);
                if (a.type === 'image') loader.image(a.key, a.url);
                else if (a.type === 'audio') loader.audio(a.key, a.url);
            } catch (e) {
                console.warn('Failed to queue asset', a, e);
            }
        }

        return assets;
    }
}

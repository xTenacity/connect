// Helper to always produce an absolute public path like '/models/props/o_piece.glb'
function publicPath(...parts: string[]) {
  const clean = parts.map(p => String(p || '').replace(/^\/+/g, '').replace(/\/+$/g, ''))
                   .filter(Boolean)
                   .join('/');
  return '/' + clean;
}

// Note: we intentionally do not assume a fixed `/assets` prefix because the
// production copy may place files at the static root (e.g. `/models/...`).
// Use `publicPath()` to build absolute URLs that match what's served from
// src/main/resources/static.

export type AssetType = 'image' | 'audio' | 'material' | 'model' | 'shader' | 'texture' |  'json' | 'text' | 'gltf';
export interface AssetDescriptor {
  key: string;
  type: AssetType;
  url: string;
}

export default class AssetManager {

    // No constructor required; keep default behavior. Older callers may pass an act string — it's ignored.

    getMusicPath(filename: string) {
        return publicPath('audio', 'music', filename);
    }

    getModelPath(filename: string) {
        return publicPath('models', filename);
    }

    // Return an array describing assets (key,type,url) — caller decides how to load
    getAssetList(opts?: { includeModels?: boolean }): AssetDescriptor[] {
        const includeModels = !!opts && !!opts.includeModels;

        const assets: AssetDescriptor[] = [
            // Project assets detected in src/main/frontend/assets
            { key: 'player-json', type: 'json', url: publicPath('player.json') },
            // music
            { key: 'music-urout', type: 'audio', url: this.getMusicPath('urout.ogg') }
        ];
        console.log("loaded player + music");
        if (includeModels) {
            // models are stored under assets/models/props
            assets.push(
                { key: 'piece-o', type: 'gltf', url: this.getModelPath('props/o_piece.glb') },
                { key: 'piece-x', type: 'gltf', url: this.getModelPath('props/x_piece.glb') }
            );
            console.log("loaded 3d models");
        }

        return assets;
    }
}

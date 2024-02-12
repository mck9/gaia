import { LoadingManager, Texture, TextureLoader } from 'three';
import { resources } from './Assets';

export class Resources {
  private manager: LoadingManager
  private callback: () => void;
  private textureLoader!: InstanceType<typeof TextureLoader>;
  public textures: Record<string, Texture>;

  constructor(path, callback: () => void) {
    this.callback = callback;

    this.textures = {};

    this.setLoadingManager();
    this.loadResources(path);
  }

  private setLoadingManager() {
    this.manager = new LoadingManager()
    this.manager.onStart = () => {
      console.log('Loading …')
    }
    this.manager.onLoad = () => {
      this.callback()
    }
    this.manager.onProgress = (url) => {
      console.log(`Load： ${url}`)
    }
    this.manager.onError = url => {
      console.log('ERR： ' + url)
    }
  }

  private loadResources(path): void {
    this.textureLoader = new TextureLoader(this.manager)
    resources.textures.forEach((item) => {
      this.textureLoader.load(path + item.url, (t) => {
        this.textures[item.name] = t
      })
    })
  }
}

// moon textures from:
// NASA's Scientific Visualization Studio
// https://svs.gsfc.nasa.gov/cgi-bin/details.cgi?aid=4720

import {
  Mesh, MeshStandardMaterial, Vector3, SphereGeometry, Group, Object3D, Texture
} from "three";

type options = {
  position: Vector3,
  textures: Record<string, Texture>
}

export default class Moon {
  public options: options;

  public moon: Object3D;
  public group: Group;

  constructor(options: options) {
    this.options = options;
    this.group = new Group();
    this.group.name = "moon_group";
  }

  async init(): Promise<void> {
    return new Promise(async (resolve) => {
      this.createMoon();
      resolve();
    });
  }

  private createMoon() {
    const geometry = new SphereGeometry(6, 64, 64);
    const material = new MeshStandardMaterial({
      map: this.options.textures.moonTexture,
      bumpMap: this.options.textures.moonElevation,
      bumpScale: 0.1,
    });
    this.moon = new Mesh(geometry, material);
    this.moon.name = "moon";
    this.moon.receiveShadow = true;
    this.moon.castShadow = true;
    this.moon.position.copy(this.options.position);
    this.moon.rotation.y = Math.PI / 1;
    this.group.add(this.moon);
  }
}

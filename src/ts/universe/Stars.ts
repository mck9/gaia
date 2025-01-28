import {
  Mesh, SphereGeometry, ShaderMaterial, Group, BackSide, Texture
} from "three";
import skyVertex from '../../shaders/earth/sky.vs';
import skyFragment from '../../shaders/earth/sky.fs';

type options = {
  radius: number,
  textures: Record<string, Texture>
}

export default class Stars {
  public options: options;

  public stars: Mesh;
  public group: Group;

  constructor(options: options) {
    this.options = options;
    this.group = new Group();
    this.group.name = "stars_group";
  }

  async init(): Promise<void> {
    return new Promise(async (resolve) => {
      this.createStars();
      resolve();
    });
  }

  private createStars() {
    const geometry = new SphereGeometry(this.options.radius, 10, 10);
    const material = new ShaderMaterial({
      uniforms: {
	map: { value: this.options.textures.stars },
      },
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: BackSide,
    });
    material.needsUpdate = true;

    this.stars = new Mesh(geometry, material);
    this.stars.rotation.z = 1.1;
    this.stars.receiveShadow = false;
    this.stars.castShadow = false;
    this.group.add(this.stars);
  }

}

import {
  Mesh, MeshBasicMaterial, Vector3, SpotLight, SphereGeometry, Group, Object3D
} from "three";

type options = {
  position: Vector3
}

export default class Sun {
  public options: options;

  public sun: Object3D;
  public group: Group;
  public light: SpotLight;

  constructor(options: options) {
    this.options = options;
    this.group = new Group();
  }

  async init(): Promise<void> {
    return new Promise(async (resolve) => {
      this.createSun();
      this.createSunLight();
      resolve();
    });
  }

  private createSun() {
    const geometry = new SphereGeometry(10, 16, 16);
    const material = new MeshBasicMaterial({
      color: 0xffffff
    });
    this.sun = new Mesh(geometry, material);
    this.sun.receiveShadow = false;
    this.sun.position.copy(this.options.position);
    this.group.add(this.sun);
  }

  private createSunLight() {
    this.light = new SpotLight(0xffffff);
    this.light.angle = Math.PI / 12;
    this.light.position.copy(this.options.position);
    this.light.penumbra = 0.5;
    this.light.decay = 0;
    this.light.distance = 0;
    this.light.intensity = 5;

    this.light.castShadow = true;
    // Set up shadow properties for the light
    this.light.shadow.mapSize.width = 1024 * 4; // default
    this.light.shadow.mapSize.height = 1024 * 4; // default
    this.light.shadow.camera.fov = 10; // default
    this.light.shadow.camera.near = 1; // default
    this.light.shadow.camera.far = 1000; // default
    this.light.shadow.focus = 0.5; // default

    this.group.add(this.light);
  }

}

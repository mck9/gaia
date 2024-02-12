import {
  Scene, PerspectiveCamera, WebGLRenderer, Vector3
} from 'three';
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

export class Basic {
  public scene: Scene;
  public camera: PerspectiveCamera;
  public renderer: WebGLRenderer;
  public controls: OrbitControls;
  public dom: HTMLElement;
  public sun_position: Vector3;
  public moon_position: Vector3;
  public stars_radius: number;

  constructor(dom: HTMLElement) {
    this.dom = dom;
    this.moon_position = new Vector3(300, 100, 0);
    this.sun_position = new Vector3(1200, 0, 0);
    this.stars_radius = 1500;
    this.initScenes();
    this.setControls();
  }

  initScenes() {
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      100000
    );
    this.camera.position.set(600, 300, -400)

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.shadowMap.enabled = false;
    //this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.dom.appendChild(this.renderer.domElement);
  }

  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.minDistance = 150;
    this.controls.maxDistance = 1000;
    this.controls.enablePan = true;
  }
}

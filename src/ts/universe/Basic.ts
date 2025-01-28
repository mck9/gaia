import {
  Scene, PerspectiveCamera, WebGLRenderer, Vector3, PCFSoftShadowMap, PointLight
} from 'three';
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

import { lon2xyz, getSubmoonPoint, getSubsolarPoint } from "../Utils/common";

export class Basic {
  public scene: Scene;
  public camera: PerspectiveCamera;
  public renderer: WebGLRenderer;
  public controls: OrbitControls;
  public dom: HTMLElement;
  public sun_position: Vector3;
  public moon_position: Vector3;
  public stars_radius: number;

  private time: Date;

  constructor(dom: HTMLElement) {
    this.dom = dom;

    this.moon_position = new Vector3(0, 0, 0);
    this.sun_position = new Vector3(0, 0, 0);
    this.stars_radius = 1500;
    this.initScenes();
    this.setControls();

    // Start animation loop
    this.animate();
  }

  // Method to calculate and update Sun and Moon positions
  updatePositions() {
    // this.time = new Date(2025,2,29,12,0,0);
    this.time = new Date();

    // Calculate submoon point
    const submoonPoint = getSubmoonPoint(this.time);
    const pm = lon2xyz(300, submoonPoint.longitude, submoonPoint.latitude);
    this.moon_position.set(pm.x, pm.y, pm.z);

    // Calculate subsolar point
    const subsolarPoint = getSubsolarPoint(this.time);
    const ps = lon2xyz(1300, subsolarPoint.longitude, subsolarPoint.latitude);
    this.sun_position.set(ps.x, ps.y, ps.z);
  }

  // Animation loop
  animate() {
    requestAnimationFrame(() => this.animate());

    // Update Sun and Moon positions every frame
    this.updatePositions();
    // Set Sun and Moon positions
    this.setPositions();

    // Update controls and render
    //this.controls.update();
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }

  // Method to set Sun and Moon positions
  setPositions() {
    const sunMesh = this.scene.getObjectByName("sun");
    if (sunMesh) {
      sunMesh.position.copy(this.sun_position);
    }

    const sunLight = this.scene.getObjectByName("sun_light") as PointLight;
    if (sunLight) {
      sunLight.position.copy(this.sun_position);
      sunLight.shadow.camera.position.copy(this.sun_position);
    }

    const moonMesh = this.scene.getObjectByName("moon");
    if (moonMesh) {
      moonMesh.position.copy(this.moon_position);
    }
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
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

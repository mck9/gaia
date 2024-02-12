import {
  PerspectiveCamera, ShaderMaterial, MeshStandardMaterial,
  Scene, WebGLRenderer,
  Vector2, Vector3, Raycaster, Sprite
} from "three";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

type options = {
  dom: HTMLElement,
  markerClick: any,
  isMobile: boolean,
  data: {
    name: string,
    url: string,
    img: string,
    latitude: number,
    longitude: number,
  }[],
}

import { Basic } from './Basic'
import Resizer from '../Utils/Resizer'
import { Resources } from './Resources';
import gsap from "gsap";
import { setOpacity, getDistance } from "../Utils/common";

// earth
import Earth from './Earth'
import Moon from './Moon'
import Sun from './Sun'
import Stars from './Stars'

export default class Universe {
  public options: options;
  public basic: Basic;
  public mouse: Vector2;
  public raycaster: Raycaster;
  public activeMarker: Sprite;
  public hoveredMarker: Sprite;
  public scene: Scene;
  public camera: PerspectiveCamera;
  public renderer: WebGLRenderer
  public controls: OrbitControls;
  public resizer: Resizer;
  public resources: Resources;
  public hq_resources: Resources;
  public earth: Earth;
  public sun: Sun;
  public moon: Moon;
  public stars: Stars;
  public zoomMarkers: boolean;
  private startX: number;
  private startY: number;
  private markerScale: number;

  constructor(options) {
    this.options = options;
    this.basic = new Basic(options.dom)
    this.mouse = new Vector2();
    this.raycaster = new Raycaster();
    this.activeMarker = null;
    this.hoveredMarker = null;
    this.scene = this.basic.scene;
    this.renderer = this.basic.renderer;
    this.controls = this.basic.controls;
    this.camera = this.basic.camera;
    this.resizer = new Resizer({ dom: options.dom })
    this.markerScale = options.isMobile ? 24 : 12;

    this.resizer.on('resize', () => {
      this.renderer.setSize(Number(this.resizer.width),
                            Number(this.resizer.height));
      this.camera.aspect =
        Number(this.resizer.width) / Number(this.resizer.height);
      this.camera.updateProjectionMatrix();
    })

    this.zoomMarkers = false;
  }

  async init(): Promise<void> {
    return new Promise(async (resolve) => {
      this.resources = new Resources("/images/lq/", async () => {
        // create universe
        this.createStars();
        this.createEarth();
        this.createSun();
        this.createMoon();
        this.render()

        this.addEvents();
      })
      resolve();
    });
  }

  async load_hq_textures(): Promise<void> {
    return new Promise(async (resolve) => {
      this.hq_resources = new Resources("/images/hq/", async () => {
        (this.stars.stars.material as ShaderMaterial).uniforms.map.value =
          this.hq_resources.textures.stars;
        (this.earth.clouds.material as MeshStandardMaterial).map =
          this.hq_resources.textures.clouds_day;
        (this.earth.clouds.material as MeshStandardMaterial).alphaMap =
          this.hq_resources.textures.clouds_day;
        (this.earth.night_earth.material as ShaderMaterial).uniforms.nightTexture.value =
          this.hq_resources.textures.nightTexture;
        (this.earth.earth.material as MeshStandardMaterial).map =
          this.hq_resources.textures.dayTexture;
        (this.earth.earth.material as MeshStandardMaterial).bumpMap =
          this.hq_resources.textures.elevation;
        (this.earth.earth.material as MeshStandardMaterial).roughnessMap =
          this.hq_resources.textures.reflectivity;
      })
      resolve();
    });
  }

  // prevent accidental clicking while rotating earth
  // save mouse pos in mouseDown and simulate click
  // if movement was smaller than threshold
  private mouseDown(event) {
    this.startX = event.pageX;
    this.startY = event.pageY;
  }

  private mouseUp(event) {
    const diffX = Math.abs(event.pageX - this.startX);
    const diffY = Math.abs(event.pageY - this.startY);

    if (diffX < 10 && diffY < 10) {
      this.onMarkerClick();
    }
  }

  private addEvents() {
    window
      .addEventListener('mousedown', this.mouseDown.bind(this), true);
    window
      .addEventListener('mouseup', this.mouseUp.bind(this), true);

    window
      .addEventListener('touchend', this.onMarkerClick.bind(this), true);
    window
      .addEventListener("mousemove", this.updateMousePos.bind(this), true);
    window
      .addEventListener("mousemove", this.selectMarker.bind(this), true);
    window
      .addEventListener("mousemove", this.hoverMarker.bind(this), true);
    this.controls
      .addEventListener("change", this.selectMarker.bind(this));
    this.controls
      .addEventListener("change", this.hoverMarker.bind(this));
  }

  private updateMousePos(event) {
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  hideMarkers() {
    this.earth.markerGroup.visible = false;
  }

  showMarkers() {
    this.earth.markerGroup.visible = true;
  }

  async createStars() {
    this.stars = new Stars({
      radius: this.basic.stars_radius,
      textures: this.resources.textures,
    })
    this.scene.add(this.stars.group)
    await this.stars.init()
  }

  async createSun() {
    this.sun = new Sun({
      position: this.basic.sun_position
    })
    this.scene.add(this.sun.group)
    await this.sun.init()
  }

  async createMoon() {
    this.moon = new Moon({
      position: this.basic.moon_position,
      textures: this.resources.textures,
    })
    this.scene.add(this.moon.group)
    await this.moon.init()
  }

  async createEarth() {
    this.earth = new Earth({
      data: this.options.data,
      dom: this.options.dom,
      textures: this.resources.textures,
      sun_position: this.basic.sun_position,
      earth: {
        radius: 70,
        rotateSpeed: 0,
        isRotation: true
      },
      marker_scale: this.markerScale,
      punctuation: {
        lightColumn: {
          color: 0xffffff,
        },
      },
    })

    this.scene.add(this.earth.group)
    await this.earth.init()
  }

  private selectMarker() {
    let selectedObject = null;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    let marker = null;

    const elements =
          this.raycaster
          .intersectObject(this.earth.group, true)
    if (elements.length > 0 && elements[0].object.parent.name !== "EarthGroup") {
      marker =
        this.raycaster
        .intersectObject(this.earth.group, true)
        .filter((object) => {
          return (object.object.userData.type === 'Marker');
        })
        .find((object) => {
          return (getDistance(0.5, 0.5, object.uv.x, object.uv.y) < 85/400);
        })
    }
    if (marker) {
      // WTF typescript? I can not leave out selectedObject variable????
      // Type 'Object3D<Object3DEventMap>' is missing the following properties from type 'Sprite': ...
      selectedObject = marker;
      this.hoveredMarker = selectedObject.object;
    } else {
      this.hoveredMarker = null;
    }
  }

  private hoverMarker() {
    if (!this.zoomMarkers) return;
    if (this.hoveredMarker) {
      if (this.activeMarker !== this.hoveredMarker) this.unhoverMarker();

      const distance = this.camera.position.distanceTo(this.controls.target);
      const factor = 1 + ((distance - 100) / 40);

      gsap.to(this.hoveredMarker.scale,
              { x: factor * this.markerScale,
                y: factor * this.markerScale,
                duration: 0.5,
                ease: "Quadratic" });

      this.options.dom.className = "cursor-pointer";
      this.activeMarker = this.hoveredMarker;
    } else {
      this.unhoverMarker();
    }
  }

  public stopRotation() {
    this.controls.autoRotateSpeed = 0;
  }

  public startRotation() {
    this.controls.autoRotateSpeed = 0.5;
  }

  // unhover active marker
  private unhoverMarker() {
    if (!this.activeMarker) return;

    gsap.to(this.activeMarker.scale, {
      x: this.markerScale,
      y: this.markerScale,
      duration: 0.5,
      ease: "Quadratic"
    });

    this.options.dom.className = "";
    this.activeMarker = null;
  }

  private onMarkerClick() {
    if (!this.zoomMarkers) return;
    if (!this.activeMarker) return;

    this.options.markerClick(this.activeMarker.userData.url);
  }

  public hideZoomMarkers() {
    if (!this.zoomMarkers) return;

    this.zoomMarkers = false;
    const newPos = new Vector3();
    newPos.copy(this.camera.position);
    newPos.setLength(781);

    gsap.to(this.camera.position, {
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
      duration: 1,
      ease: "Quadratic"
    });
    const opacity = { value: 1 };
    gsap.to(opacity, {
      value: 0,
      duration: 1,
      ease: "Quadratic",
      onUpdate: setOpacity,
      onUpdateParams: [this.earth.markerGroup, opacity],
      onComplete: this.hideMarkers.bind(this)
    })
  }

  public showZoomMarkers() {
    if (this.zoomMarkers) return;

    this.zoomMarkers = true;
    const newPos = new Vector3();
    newPos.copy(this.camera.position);
    newPos.setLength(260);

    gsap.to(this.camera.position, {
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
      duration: 1,
      ease: "Quadratic"
    });
    const opacity = { value: 0 };
    gsap.to(opacity, {
      value: 1,
      duration: 1,
      ease: "Quadratic",
      onUpdate: setOpacity,
      onUpdateParams: [this.earth.markerGroup, opacity],
      onStart: this.showMarkers.bind(this)
    })
  }

  public render() {
    this.controls && this.controls.update()
    this.earth && this.earth.render()
    //window.world = this;

    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.render.bind(this))
  }
}

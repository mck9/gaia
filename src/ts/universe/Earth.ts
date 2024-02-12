import {
  Color, Group, Mesh, NormalBlending,
  Object3D, SphereGeometry, DoubleSide, MeshBasicMaterial, PlaneGeometry,
  ShaderMaterial, MeshStandardMaterial,
  Sprite, SpriteMaterial, Texture, TextureLoader, Vector3
} from "three";

import html2canvas from "html2canvas";

import earthApertureVertex from '../../shaders/earth/aperture.vs';
import earthApertureShader from '../../shaders/earth/aperture.fs';

import dayNightVertex from '../../shaders/earth/day_night.vs';
import dayNightShader from '../../shaders/earth/day_night.fs';

import { lon2xyz, punctuation } from "../Utils/common";

type options = {
  data: {
    name: string,
    url: string,
    img: string,
    latitude: number,
    longitude: number,
  }[],
  dom: HTMLElement,
  textures: Record<string, Texture>,
  marker_scale: number,
  sun_position: Vector3,
  earth: {
    radius: number,
    rotateSpeed: number,
    isRotation: boolean,
  }
  punctuation: punctuation,
}

type uniforms = {
  glowColor: { value: Color; }
  scale: { type: string; value: number; }
  bias: { type: string; value: number; }
  power: { type: string; value: number; }
  isHover: { value: boolean; }
  map: { value: Texture }
  dayTexture: { value: Texture }
  nightTexture: { value: Texture }
  sunPosition: { value: Vector3 }
}

export default class earth {

  public group: Group;
  public earthGroup: Group;
  public atmGroup: Group;
  public markerGroup: Group;

  public options: options;
  public uniforms: uniforms

  public earth: Mesh;
  public night_earth: Mesh;
  public clouds: Mesh;
  public markupPoint: Group;
  public waveMeshArr: Object3D[];

  public x: number;
  public n: number;
  public isRotation: boolean;

  constructor(options: options) {

    this.options = options;

    this.group = new Group();
    this.group.name = "group";
    this.group.scale.set(1, 1, 1);
    this.earthGroup = new Group();
    this.earthGroup.name = "EarthGroup";
    this.markerGroup = new Group();
    this.markerGroup.name = "MarkerGroup";
    this.markerGroup.visible = false;
    this.atmGroup = new Group();
    this.atmGroup.name = "AtmGroup";
    this.group.add(this.earthGroup);
    this.group.add(this.atmGroup);
    this.group.add(this.markerGroup);

    this.markupPoint = new Group();
    this.markupPoint.name = "markupPoint";
    this.waveMeshArr = [];

    this.isRotation = this.options.earth.isRotation

    this.uniforms = {
      glowColor: { value: new Color(0x0cd1eb) },
      scale: { type: "f", value: -1.0 },
      bias: { type: "f", value: 1.0 },
      power: { type: "f", value: 3.3 },
      isHover: { value: false },
      map: { value: null },
      dayTexture: { value: null },
      nightTexture: { value: null },
      sunPosition: { value: this.options.sun_position },
    };
  }

  async init(): Promise<void> {
    return new Promise(async (resolve) => {
      this.group.rotation.z = 0.4;
      this.createEarth();
      // the glow around earth
      this.createEarthGlow();
      this.createClouds();
      // blue shade on inside
      this.createEarthAperture();
      await this.createMarkupPoint();
      await this.createSpriteLabel();
      resolve();
    })
  }

  createClouds() {
    const material = new MeshStandardMaterial({
      map: this.options.textures.clouds_day,
      alphaMap: this.options.textures.clouds_day,
      transparent: true,
    });

    const geometry = new SphereGeometry(this.options.earth.radius + 0.6, 64, 64);
    this.clouds = new Mesh(geometry, material);
    this.clouds.castShadow = true; //default
    this.clouds.receiveShadow = true; //default
    this.earthGroup.add(this.clouds);
  }

  createEarth() {
    this.night_earth = new Mesh(
      new SphereGeometry(this.options.earth.radius + .1, 64, 64),
      new ShaderMaterial({
	wireframe: false,
	uniforms: {
          nightTexture: { value: this.options.textures.nightTexture },
          sunPosition: this.uniforms.sunPosition,
	},
	vertexShader: dayNightVertex,
	fragmentShader: dayNightShader,
	opacity: 0.5,
	transparent: true,
      })
    );
    this.earthGroup.add(this.night_earth);

    // my earth
    const geometry = new SphereGeometry(this.options.earth.radius, 64, 64);
    const material = new MeshStandardMaterial({
      map: this.options.textures.dayTexture,
      bumpMap: this.options.textures.elevation,
      bumpScale: 5,
      displacementScale: 3,
      metalness: 0,
      roughnessMap: this.options.textures.reflectivity,
      roughness: 0.775,
      transparent: false,
    });
    material.needsUpdate = true;
    this.earth = new Mesh(geometry, material);
    this.earth.receiveShadow = true; //default
    this.earth.castShadow = true;
    this.earth.name = "earth";
    this.earthGroup.add(this.earth);
  }

  createEarthGlow() {
    const R = this.options.earth.radius;

    const spriteMaterial = new SpriteMaterial({
      map: this.options.textures.glow,
      color: 0x4390d1, //0xffffff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });

    const sprite = new Sprite(spriteMaterial);
    sprite.scale.set(R * 3, R * 3, 1);
    this.atmGroup.add(sprite);
  }

  createEarthAperture() {
    const uniforms = {
      coeficient: { type: "f", value: 1.0 },
      power: { type: "f", value: 3 },
      glowColor: { type: "c", value: new Color(0x66ccff) },
      sunPosition: this.uniforms.sunPosition,
    };
    const material1 = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: earthApertureVertex,
      fragmentShader: earthApertureShader,
      blending: NormalBlending,
      transparent: true,
      depthWrite: false,
    });
    const sphere = new SphereGeometry(
      this.options.earth.radius + 0.7,
      64,
      64
    );
    const mesh = new Mesh(sphere, material1);
    this.atmGroup.add(mesh);
  }

  async createMarkupPoint() {
    await Promise.all(this.options.data.map(async (obj) => {
      const light_pillar = this.createLightPillar({
        radius: this.options.earth.radius,
        lon: obj.longitude,
        lat: obj.latitude,
        textures: this.options.textures,
        punctuation: this.options.punctuation
      });

      this.markupPoint.add(light_pillar);
      this.markerGroup.add(this.markupPoint)
    }))
  }

  createLightPillar = (options: { radius: number, lon: number, lat: number, textures: Record<string, Texture>, punctuation: punctuation }) => {
    // FIXME: magic value, corresponds to 1.3 in createSpriteLabel
    const height = options.radius * 0.27;
    const geometry = new PlaneGeometry(options.radius * 0.05, height);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, 0, height / 2);
    const material = new MeshBasicMaterial({
      map: options.textures.light_column,
      color: options.punctuation.lightColumn.color,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    const group = new Group();
    group.add(mesh, mesh.clone().rotateZ(Math.PI / 2));
    const SphereCoord = lon2xyz(options.radius, options.lon, options.lat);
    group.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);
    const coordVec3 = new Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
    const meshNormal = new Vector3(0, 0, 1);
    group.quaternion.setFromUnitVectors(meshNormal, coordVec3);
    return group;
  }

  async createSpriteLabel() {
    await Promise.all(this.options.data.map(async item => {
      const div = `<div class="fire-div"><img src="${item.img}" /><span class="fire-title">${item.name}</span></div>`;
      const shareContent = document.getElementById("html2canvas");
      shareContent.innerHTML = div;
      const opts = {
        backgroundColor: null,
        scale: 1,
        dpi: window.devicePixelRatio,
	useCORS: true,
	allowTaint: true,
      };
      const canvas = await html2canvas(shareContent, opts)
      const map = new TextureLoader().load(canvas.toDataURL("image/png"));
      const material = new SpriteMaterial({ map: map, transparent: true });
      const sprite = new Sprite(material);
      sprite.scale.set(this.options.marker_scale, this.options.marker_scale, 0);
      const p = lon2xyz(this.options.earth.radius * 1.001, item.longitude, item.latitude);
      sprite.position.set(p.x * 1.3, p.y * 1.3, p.z * 1.3);
      sprite.visible = true;
      sprite.name = item.name;
      sprite.userData = {
        type: "Marker",
        url: item.url
      };
      this.markerGroup.add(sprite);
    }))
  }

  render() {
    // do nothing
  }

}

import { Vector3 } from "three";

export type punctuation = {
  lightColumn: {
    color: number,
  },
}

export const lon2xyz = (R:number, longitude:number, latitude:number): Vector3 => {
  const lon = longitude * Math.PI / 180;
  const lat = latitude * Math.PI / 180;

  const x = R * Math.cos(lat) * Math.cos(-lon);
  const y = R * Math.sin(lat);
  const z = R * Math.cos(lat) * Math.sin(-lon);

  return new Vector3(x, y, z);
}

export const setOpacity = (obj, opacity) => {
  obj.children.forEach((child) => {
    setOpacity(child, opacity);
  });
  if (obj.material) {
    obj.material.opacity = opacity.value;
  }
}

export const getDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
}

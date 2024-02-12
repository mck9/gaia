interface ITextures {
  name: string
  url: string
}

export interface IResources {
  textures: ITextures[],
}

const files = [
  'glow',
  'light_column',
];

const textures = files.map(item => {
  return {
    name: item,
    url: 'earth/' + item + '.png',
  }
})

textures.push({
  name: 'moonTexture',
  url: 'moon/lroc_color_poles_1k.jpg'
})

textures.push({
  name: 'moonElevation',
  url: 'moon/ldem_3_8bit.jpg'
})

textures.push({
  name: 'dayTexture',
  url: 'earth/texture_day.jpg'
})

textures.push({
  name: 'nightTexture',
  url: 'earth/texture_night.jpg'
})

textures.push({
  name: 'elevation',
  url: 'earth/elevation.jpg'
})

textures.push({
  name: 'clouds_day',
  url: 'earth/clouds_day.jpg'
})

textures.push({
  name: 'reflectivity',
  url: 'earth/reflectivity.png'
})

textures.push({
  name: 'stars',
  url: 'stars/stars.jpg'
})

const resources: IResources = {
  textures
}

export {
  resources
}

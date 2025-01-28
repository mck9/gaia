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

export const getSubmoonPoint = (dateTime) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const toDegrees = (radians) => radians * (180 / Math.PI);

  // Julian date calculation
  const calculateJulianDate = (date) => {
    return date.getTime() / 86400000 + 2440587.5; // Convert from Unix epoch
  };

  // Number of days since J2000.0
  const julianDate = calculateJulianDate(dateTime);
  const daysSinceJ2000 = julianDate - 2451545.0;

  // Mean longitude of the Moon (L)
  const L = (218.316 + 13.176396 * daysSinceJ2000) % 360;

  // Mean anomaly of the Moon (M)
  const M = (134.963 + 13.064993 * daysSinceJ2000) % 360;

  // Ecliptic longitude of the Moon (lambda)
  const lambda = L + 6.289 * Math.sin(toRadians(M)); // Includes the Moon's equation of the center

  // Moon's declination (delta, in degrees)
  const obliquity = 23.439; // Earth's obliquity
  const declination = toDegrees(
    Math.asin(Math.sin(toRadians(lambda)) * Math.sin(toRadians(obliquity)))
  );

  // Greenwich Sidereal Time (GST) in degrees
  const GST = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;

  // Submoon longitude
  const submoonLongitude = (lambda - GST) % 360;
  const longitude = submoonLongitude > 180
    ? submoonLongitude - 360
    : submoonLongitude;

  // Submoon latitude = declination
  const latitude = declination;

  return {
    latitude: Math.round(latitude * 1000) / 1000,
    longitude: Math.round(longitude * 1000) / 1000
  };
}

// Function to calculate subsolar point using astronomical formulas
export const getSubsolarPoint = (date) => {
  // Convert date to Julian date
  const julianDate = (date.getTime() / 86400000) + 2440587.5;

  // Calculate number of days since J2000.0
  const daysSinceJ2000 = julianDate - 2451545.0;

  // Calculate solar declination angle
  const obliquity = 23.439 * Math.PI / 180; // Earth's obliquity in radians
  const meanLongitude = (280.460 + 0.9856474 * daysSinceJ2000) % 360;
  const meanAnomaly = (357.528 + 0.9856003 * daysSinceJ2000) % 360;

  // Convert to radians
  const meanAnomalyRad = meanAnomaly * Math.PI / 180;

  // Calculate ecliptic longitude
  const eclipticLongitude = meanLongitude + 1.915 * Math.sin(meanAnomalyRad) +
    0.020 * Math.sin(2 * meanAnomalyRad);
  const eclipticLongitudeRad = eclipticLongitude * Math.PI / 180;

  // Calculate declination
  const declination = Math.asin(Math.sin(obliquity) *
    Math.sin(eclipticLongitudeRad));

  // Calculate latitude (declination in degrees)
  const latitude = declination * 180 / Math.PI;

  // Calculate longitude
  const gmst = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;
  let longitude = -((gmst - meanLongitude + 180) % 360 - 180);

  // Normalize longitude to -180 to 180
  if (longitude > 180) longitude -= 360;
  if (longitude < -180) longitude += 360;

  return {
    latitude: Math.round(latitude * 1000) / 1000,
    longitude: Math.round(longitude * 1000) / 1000
  };
}

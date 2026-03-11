const { Origin, Horoscope } = require('circular-natal-horoscope-js');

const origin = new Origin({
  year: 1990, month: 5, date: 15,
  hour: 15, minute: 30,
  latitude: 30.7333, longitude: 76.7794
});

const horoLabels = Horoscope.CelestialLabels();
const horo = new Horoscope({ origin });

const bodies = horo.CelestialBodies;
const points = horo.CelestialPoints;

console.log("Bodies Keys:", Object.keys(bodies));
console.log("Points Keys:", Object.keys(points));

const nodes = {
  northnode: points.northnode ? points.northnode.label : 'MISSING',
  southnode: points.southnode ? points.southnode.label : 'MISSING'
};
console.log("Nodes Found:", nodes);

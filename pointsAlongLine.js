//
// Calculates the points along a line at a certain specified interval (in miles)
//
// node pointsAlongLine.js input.geojson output.geojson distance
//
// Ensure turf is installed
// npm install @turf/turf fs
// 
 
const turf = require('@turf/turf');
const fs = require('fs');

if (process.argv.length < 4) {
    console.error("Usage: node generatePoints.js <sourceGeoJSON> <outputFileName>");
    process.exit(1);
}

const sourceGeoJSONPath = process.argv[2];
const outputFileName = process.argv[3];
const distanceInterval = 1; // 1 mile by default. Adjust this if needed.

try {
    const data = fs.readFileSync(sourceGeoJSONPath, 'utf8');
    const inputGeoJSON = JSON.parse(data);
    
    if (inputGeoJSON.type !== 'FeatureCollection') {
        console.error("The input GeoJSON must be a FeatureCollection.");
        process.exit(1);
    }

    let allPoints = [];

    inputGeoJSON.features.forEach(feature => {
        if (feature.geometry.type === "LineString") {
            const length = turf.length(feature, {units: 'miles'});
            for (let i = 0; i <= length; i += distanceInterval) {
                const point = turf.along(feature, i, {units: 'miles'});
                point.properties.mile = i;
                allPoints.push(point);
            }
        } else if (feature.geometry.type === "MultiLineString") {
            feature.geometry.coordinates.forEach(line => {
                const lineFeature = turf.lineString(line);
                const length = turf.length(lineFeature, {units: 'miles'});
                for (let i = 0; i <= length; i += distanceInterval) {
                    const point = turf.along(lineFeature, i, {units: 'miles'});
                    point.properties.mile = i;
                    allPoints.push(point);
                }
            });
        }
    });

    if (allPoints.length === 0) {
        console.error("No points were generated. Ensure the input GeoJSON contains valid LineString or MultiLineString features.");
        process.exit(1);
    }

    const outputGeoJSON = turf.featureCollection(allPoints);
    fs.writeFileSync(outputFileName, JSON.stringify(outputGeoJSON, null, 2), 'utf8');
    console.log("Points generated and saved to", outputFileName);
} catch (err) {
    console.error("An error occurred:", err);
}

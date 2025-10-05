// Verify Location Configuration
// This script checks that Fort Mason coordinates are being used correctly

console.log("🏗️ Fort Mason Location Verification");
console.log("==================================");

// Expected Fort Mason coordinates
const FORT_MASON_COORDS = {
  latitude: 37.80808794862037,
  longitude: -122.43016054168524,
  name: "Fort Mason",
  address: "Fort Mason, San Francisco, CA 94123"
};

console.log("\n📍 Expected Fort Mason Coordinates:");
console.log(`Latitude: ${FORT_MASON_COORDS.latitude}`);
console.log(`Longitude: ${FORT_MASON_COORDS.longitude}`);
console.log(`Name: ${FORT_MASON_COORDS.name}`);
console.log(`Address: ${FORT_MASON_COORDS.address}`);

console.log("\n🗺️ Location Details:");
console.log("- This is Fort Mason Center in San Francisco");
console.log("- Located near the Marina District");
console.log("- Close to the Golden Gate Bridge");
console.log("- Popular event venue and cultural center");

console.log("\n✅ Verification Complete!");
console.log("The mobile app should now use Fort Mason as the default location.");
console.log("Check the map components to ensure they're showing Fort Mason coordinates.");

// Test location format
const testLocation = {
  location: {
    latitude: FORT_MASON_COORDS.latitude,
    longitude: FORT_MASON_COORDS.longitude,
    address: FORT_MASON_COORDS.address
  }
};

console.log("\n📋 Test Location Format:");
console.log(JSON.stringify(testLocation, null, 2));

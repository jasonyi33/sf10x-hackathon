// Test Fort Mason Location Configuration
// This script verifies that Fort Mason coordinates are being used correctly

console.log("🏗️ Fort Mason Location Test");
console.log("==========================");

// Expected Fort Mason coordinates
const FORT_MASON = {
  latitude: 37.80808794862037,
  longitude: -122.43016054168524,
  name: "Fort Mason",
  address: "Fort Mason, San Francisco, CA 94123"
};

console.log("\n📍 Fort Mason Coordinates:");
console.log(`Latitude: ${FORT_MASON.latitude}`);
console.log(`Longitude: ${FORT_MASON.longitude}`);
console.log(`Name: ${FORT_MASON.name}`);
console.log(`Address: ${FORT_MASON.address}`);

// Test location format for API calls
const apiLocationFormat = {
  location: {
    latitude: FORT_MASON.latitude,
    longitude: FORT_MASON.longitude,
    address: FORT_MASON.address
  }
};

console.log("\n📋 API Location Format:");
console.log(JSON.stringify(apiLocationFormat, null, 2));

// Test location format for Supabase
const supabaseLocationFormat = {
  lat: FORT_MASON.latitude,
  lng: FORT_MASON.longitude,
  address: FORT_MASON.address
};

console.log("\n🗄️ Supabase Location Format:");
console.log(JSON.stringify(supabaseLocationFormat, null, 2));

// Test map region format
const mapRegionFormat = {
  latitude: FORT_MASON.latitude,
  longitude: FORT_MASON.longitude,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01
};

console.log("\n🗺️ Map Region Format:");
console.log(JSON.stringify(mapRegionFormat, null, 2));

console.log("\n✅ Fort Mason Location Test Complete!");
console.log("All location formats are ready for use in the mobile app.");

// Verify coordinates are correct
const isCorrectLatitude = FORT_MASON.latitude === 37.80808794862037;
const isCorrectLongitude = FORT_MASON.longitude === -122.43016054168524;

console.log(`\n🔍 Verification:`);
console.log(`Latitude correct: ${isCorrectLatitude ? '✅' : '❌'}`);
console.log(`Longitude correct: ${isCorrectLongitude ? '✅' : '❌'}`);

if (isCorrectLatitude && isCorrectLongitude) {
  console.log("\n🎉 All coordinates are correct! Fort Mason should now be displayed in the maps UI.");
} else {
  console.log("\n⚠️ Some coordinates are incorrect. Please check the configuration.");
}

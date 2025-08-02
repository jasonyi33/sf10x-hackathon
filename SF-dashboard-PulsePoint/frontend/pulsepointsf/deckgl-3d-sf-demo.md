# Building a Static 3D Greyscale Map of San Francisco with deck.gl and MapTiler

## Introduction

This document provides a step-by-step guide to creating a visually striking, static 3D map of San Francisco using [deck.gl](https://deck.gl/) and [MapTiler](https://www.maptiler.com/) as the basemap provider. The map will feature extruded building polygons for a true 3D effect, rendered in a minimalist, greyscale style—no satellite imagery, just clean vector geometry. The implementation uses React and leverages deck.gl’s high-performance WebGL rendering.

## Prerequisites

- Node.js and npm installed (use `nvm use node` in this project to avoid version conflicts)
- Basic familiarity with React
- A free [MapTiler Cloud API key](https://www.maptiler.com/cloud/) (sign up and create a project to obtain one)
- Internet connection to fetch vector tiles

## Project Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd SF-dashboard-PulsePoint/frontend/pulsepointsf
   nvm use node
   ```

2. **Install dependencies:**
   ```bash
   npm install @deck.gl/core @deck.gl/react @deck.gl/layers maplibre-gl react-map-gl
   ```

   - `@deck.gl/core`, `@deck.gl/react`, `@deck.gl/layers`: Core deck.gl packages
   - `maplibre-gl`: Open-source Mapbox GL JS alternative, supports MapTiler vector tiles
   - `react-map-gl`: React wrapper for Maplibre/Mapbox maps

## MapTiler Greyscale Basemap

MapTiler provides a variety of vector tile styles. For a minimalist, greyscale look, use the "Basic" or "Toner" style. You will need your MapTiler API key.

Example MapTiler style URL (replace `YOUR_MAPTILER_KEY`):
```
https://api.maptiler.com/maps/basic/style.json?key=YOUR_MAPTILER_KEY
```

## Creating the React 3D Map Component

Below is a complete example of a React component that renders a static, 3D, greyscale map of San Francisco with extruded buildings.

```jsx
// SanFrancisco3DMap.js
import * as React from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { GeoJsonLayer } from '@deck.gl/layers';

// San Francisco center coordinates
const INITIAL_VIEW_STATE = {
  longitude: -122.4194,
  latitude: 37.7749,
  zoom: 13,
  pitch: 60,
  bearing: -30,
};

const MAPTILER_STYLE = 'https://api.maptiler.com/maps/basic/style.json?key=YOUR_MAPTILER_KEY';

// Example: Open data for SF buildings (GeoJSON)
// For a real app, fetch from a public source or use MapTiler's vector tiles for buildings
const BUILDINGS_GEOJSON_URL = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/geojson/vancouver-blocks.json';

export default function SanFrancisco3DMap() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch(BUILDINGS_GEOJSON_URL)
      .then((resp) => resp.json())
      .then(setData);
  }, []);

  const layers = [
    data &&
      new GeoJsonLayer({
        id: 'buildings',
        data,
        extruded: true,
        wireframe: false,
        filled: true,
        getElevation: (f) => f.properties.height || 20,
        getFillColor: [180, 180, 180, 200],
        getLineColor: [80, 80, 80, 255],
        opacity: 1,
        pickable: false,
      }),
  ];

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={false}
      layers={layers}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Map
        mapStyle={MAPTILER_STYLE}
        mapLib={import('maplibre-gl')}
        attributionControl={true}
      />
    </DeckGL>
  );
}
```

**Notes:**
- Replace `YOUR_MAPTILER_KEY` with your actual MapTiler API key.
- The example uses a Vancouver buildings dataset for demonstration. For San Francisco, use a public GeoJSON of SF buildings or MapTiler’s vector tiles (see below).
- The map is static: no interactivity, tooltips, or click events.

## Using San Francisco Building Data

For a true SF map, you can use:
- [SF Open Data: Building Footprints](https://data.sfgov.org/Housing-and-Buildings/Building-Footprints/ynuv-fyni)
- Or MapTiler’s vector tiles for buildings (requires parsing vector tiles, see deck.gl’s MVTLayer)

To use a local or remote GeoJSON, update `BUILDINGS_GEOJSON_URL` accordingly.

## Running the Demo

1. Add the `SanFrancisco3DMap.js` component to your React app (e.g., in `app/components/`).
2. Import and render it in your main page (e.g., `app/page.js`).
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app in your browser to view the 3D map.

## Troubleshooting

- If the map does not render, check your MapTiler API key and network access.
- If buildings do not appear, verify the GeoJSON URL and data format.
- For custom styles, adjust the `getFillColor`, `getLineColor`, and `getElevation` properties in the layer.

## References

- [deck.gl Documentation](../../deckgl-docs/docs/)
- [deck.gl GeoJsonLayer API](../../deckgl-docs/docs/api-reference/layers/geojson-layer.md)
- [MapTiler Vector Tiles](https://www.maptiler.com/maps/)
- [Maplibre GL JS](https://maplibre.org/)
- [SF Open Data: Building Footprints](https://data.sfgov.org/Housing-and-Buildings/Building-Footprints/ynuv-fyni)

---

This document provides a complete, high-context guide for building a static, 3D, greyscale map of San Francisco using deck.gl and MapTiler, suitable for design-forward dashboards and data visualization projects.

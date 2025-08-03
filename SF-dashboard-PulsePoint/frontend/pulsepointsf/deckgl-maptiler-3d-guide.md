# Comprehensive Guide: Installing deck.gl and Displaying a 3D MapTiler Map for Any City

---

## Introduction

This document provides an in-depth, step-by-step guide for installing [deck.gl](https://deck.gl/) and configuring it to display a 3D map of any city using [MapTiler](https://www.maptiler.com/) as the basemap provider. The focus is on creating a visually compelling, performant, and highly customizable 3D map experience in a modern React application. This guide is designed for developers, designers, and data visualization practitioners seeking to leverage the power of WebGL-based mapping for urban, architectural, or geospatial projects.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Installing Dependencies](#installing-dependencies)
5. [Obtaining a MapTiler API Key](#obtaining-a-maptiler-api-key)
6. [Understanding MapTiler Vector Tiles and Styles](#understanding-maptiler-vector-tiles-and-styles)
7. [Creating the 3D Map Component](#creating-the-3d-map-component)
8. [Working with 3D Data: Buildings and Terrain](#working-with-3d-data-buildings-and-terrain)
9. [Customizing the Visualization](#customizing-the-visualization)
10. [Running the Application](#running-the-application)
11. [Troubleshooting and Best Practices](#troubleshooting-and-best-practices)
12. [References and Further Reading](#references-and-further-reading)

---

## Overview

deck.gl is a powerful, open-source WebGL framework for visual exploratory data analysis of large datasets. When combined with MapTiler’s vector tiles, it enables the creation of interactive or static 3D city maps with rich cartographic styling and high performance. This guide will walk through the process of setting up a React project, installing deck.gl, integrating MapTiler as a basemap, and rendering 3D features such as buildings or terrain for any city worldwide.

---

## Prerequisites

Before proceeding, ensure the following requirements are met:

- **Node.js and npm**: Use Node Version Manager (nvm) to avoid version conflicts. In this project, always run `nvm use node` before installing or running dependencies.
- **Basic React knowledge**: Familiarity with React components, hooks, and project structure.
- **MapTiler Cloud account**: Sign up for a free account at [MapTiler Cloud](https://www.maptiler.com/cloud/) to obtain an API key.
- **Internet access**: Required for fetching vector tiles and map data.

---

## Project Setup

1. **Navigate to the frontend directory** where your React project will reside:
   ```bash
   cd SF-dashboard-PulsePoint/frontend
   nvm use node
   ```

2. **Initialize a new React project** (if you do not already have one):
   ```bash
   npx create-react-app maptiler-3d-demo
   cd maptiler-3d-demo
   ```

   If you are integrating into an existing project, skip this step.

---

## Installing Dependencies

Install the required packages for deck.gl, MapTiler, and React integration:

```bash
npm install @deck.gl/core @deck.gl/react @deck.gl/layers maplibre-gl react-map-gl
```

- `@deck.gl/core`, `@deck.gl/react`, `@deck.gl/layers`: Core deck.gl packages for rendering and layer management.
- `maplibre-gl`: Open-source alternative to Mapbox GL JS, fully compatible with MapTiler vector tiles.
- `react-map-gl`: React wrapper for Maplibre/Mapbox maps, enabling seamless integration with deck.gl.

---

## Obtaining a MapTiler API Key

1. Visit [MapTiler Cloud](https://www.maptiler.com/cloud/) and sign up for a free account.
2. Create a new project and generate an API key.
3. Copy the API key; you will use it in your map style URL.

---

## Understanding MapTiler Vector Tiles and Styles

MapTiler offers a variety of vector tile styles, including minimalist, greyscale, and terrain-focused options. For a 3D city map, the "Basic" or "Toner" styles are recommended for their clarity and design-forward appearance.

**Example MapTiler style URL:**
```
https://api.maptiler.com/maps/basic/style.json?key=YOUR_MAPTILER_KEY
```

Replace `YOUR_MAPTILER_KEY` with your actual API key.

---

## Creating the 3D Map Component

Below is a detailed example of a React component that renders a 3D map for any city, using deck.gl and MapTiler. This example uses extruded building polygons for the 3D effect.

```jsx
// City3DMap.js
import * as React from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { GeoJsonLayer } from '@deck.gl/layers';

// Set the initial view state to your city of choice
const INITIAL_VIEW_STATE = {
  longitude: -74.006, // Example: New York City
  latitude: 40.7128,
  zoom: 13,
  pitch: 60,
  bearing: -30,
};

const MAPTILER_STYLE = 'https://api.maptiler.com/maps/basic/style.json?key=YOUR_MAPTILER_KEY';

// Example: Replace with a GeoJSON URL for your city’s buildings
const BUILDINGS_GEOJSON_URL = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/geojson/vancouver-blocks.json';

export default function City3DMap() {
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

**Key Points:**
- Adjust `INITIAL_VIEW_STATE` to center the map on your city of interest.
- Replace `BUILDINGS_GEOJSON_URL` with a GeoJSON dataset for your city’s buildings. Many cities provide open data portals with building footprints and heights.
- The map is static and minimalist, with no interactivity.

---

## Working with 3D Data: Buildings and Terrain

### Buildings

- Most cities have open data portals with building footprints and, sometimes, height attributes.
- Example sources:
  - [OpenStreetMap](https://www.openstreetmap.org/) (export building data as GeoJSON)
  - [Local government open data portals] (e.g., [NYC Open Data](https://opendata.cityofnewyork.us/), [SF Open Data](https://data.sfgov.org/))
- If height data is missing, use a default value or randomize for visual effect.

### Terrain

- For terrain, use deck.gl’s `TerrainLayer` or `MVTLayer` with MapTiler’s terrain tiles.
- MapTiler provides global terrain tiles, which can be integrated for a more topographically accurate map.

---

## Customizing the Visualization

deck.gl is highly customizable. Consider the following enhancements:

- **Color schemes:** Adjust `getFillColor` and `getLineColor` for different visual moods (e.g., monochrome, pastel, high-contrast).
- **Lighting:** deck.gl supports advanced lighting effects for realistic 3D rendering.
- **Layer stacking:** Add additional layers (e.g., roads, parks, water) for richer context.
- **Camera controls:** Enable or disable user interaction with the map (controller: true/false).
- **Performance:** For large datasets, use binary data formats or server-side tiling.

---

## Running the Application

1. **Add the 3D map component** to your React app (e.g., in `src/components/City3DMap.js`).
2. **Import and render** the component in your main page (e.g., `App.js`).
3. **Start the development server:**
   ```bash
   npm start
   ```
4. **Open your browser** to view the 3D map.

---

## Troubleshooting and Best Practices

- **Map not rendering?** Double-check your MapTiler API key and network connectivity.
- **No buildings visible?** Ensure your GeoJSON URL is correct and the data format matches deck.gl’s expectations.
- **Performance issues?** Simplify the dataset, use lower zoom levels, or optimize layer settings.
- **Styling issues?** Experiment with different MapTiler styles or custom vector tile styles for the desired aesthetic.
- **API limits:** Free MapTiler accounts have usage limits; upgrade if needed for production.

---

## References and Further Reading

- [deck.gl Documentation](https://deck.gl/docs)
- [deck.gl GeoJsonLayer API](https://deck.gl/docs/api-reference/layers/geojson-layer)
- [deck.gl MVTLayer API](https://deck.gl/docs/api-reference/geo-layers/mvt-layer)
- [MapTiler Vector Tiles](https://www.maptiler.com/maps/)
- [Maplibre GL JS](https://maplibre.org/)
- [OpenStreetMap Data](https://www.openstreetmap.org/)
- [SF Open Data: Building Footprints](https://data.sfgov.org/Housing-and-Buildings/Building-Footprints/ynuv-fyni)
- [NYC Open Data: Building Footprints](https://data.cityofnewyork.us/Housing-Development/Building-Footprints/nqwf-w8eh)

---

## Conclusion

By following this guide, we can install deck.gl, configure MapTiler as a basemap, and render a 3D map for any city with extruded buildings or terrain. The approach is modular, scalable, and highly customizable, making it suitable for a wide range of urban visualization and geospatial analysis projects. For further customization, consult the deck.gl and MapTiler documentation, and experiment with different data sources and styles to achieve the desired visual impact.

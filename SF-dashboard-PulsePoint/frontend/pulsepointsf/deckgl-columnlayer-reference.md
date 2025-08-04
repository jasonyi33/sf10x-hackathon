# deck.gl ColumnLayer: Comprehensive Reference for 3D Cylinder Geometry and Sizing

## Introduction

This document provides a detailed, high-context reference for using deck.gl’s `ColumnLayer` to render 3D cylinders (columns) with precise control over geometry, sizing, and visual appearance. It is designed for future-proof, design-forward dashboards and spatial data visualizations, with a focus on controlling the base radius and related properties.

---

## 1. ColumnLayer Geometry & Sizing: Summary Table

| Property         | Type/Default         | Description / Effect on Geometry & Rendering                | Notes / Interactions                |
|------------------|---------------------|-------------------------------------------------------------|-------------------------------------|
| `radius`         | number (required)   | The base radius of each cylinder, in units set by `radiusUnits`. Can be a number or accessor function. | This is the primary control for the base size. |
| `radiusUnits`    | string ('meters')   | Units for `radius`: `'meters'`, `'common'`, or `'pixels'`.  | Use `'pixels'` for screen-space sizing.        |
| `coverage`       | number (0-1, default 1) | Multiplies the radius: actual rendered radius is `coverage * radius`. | Use to shrink all columns proportionally.      |
| `diskResolution` | number (default 12) | Number of sides for the cylinder base (polygon tessellation). | Higher = smoother, but more GPU cost.          |
| `extruded`       | boolean (default true) | Whether to render as 3D cylinders (true) or flat disks (false). | 3D effect requires `extruded: true`.           |
| `elevationScale` | number (default 1)  | Multiplies the height of each column.                       | For vertical exaggeration.                     |
| `getElevation`   | accessor            | Height of each column, in units of meters.                  | Can be a function or constant.                 |
| `getPosition`    | accessor            | [lng, lat] or [x, y] coordinate for each column.            | Required for placement.                        |
| `getFillColor`   | accessor            | RGBA color for each column.                                 | For visual encoding.                           |
| `getLineColor`   | accessor            | RGBA color for outline (if `stroked: true`).                | Only for non-extruded columns.                 |
| `stroked`        | boolean (default false) | Whether to draw outline around disks (only if `extruded: false`). | Not for 3D columns.                            |
| `material`       | object              | Lighting/shading properties for 3D rendering.               | For realistic effects.                         |

---

## 2. Minimal Code Examples

### Example 1: Static Radius (All Columns Same Size)
```js
import { ColumnLayer } from '@deck.gl/layers';

const layer = new ColumnLayer({
  id: 'static-radius',
  data: myData,
  getPosition: d => [d.lng, d.lat],
  getElevation: d => d.value * 100,
  radius: 100, // All columns have 100 meter base radius
  extruded: true,
  getFillColor: [200, 100, 80, 180]
});
```

### Example 2: Data-Driven Radius (Radius as a Function of Data)
```js
const layer = new ColumnLayer({
  id: 'dynamic-radius',
  data: myData,
  getPosition: d => [d.lng, d.lat],
  getElevation: d => d.value * 100,
  radius: d => Math.max(Math.sqrt(d.count) * 10, 20), // Data-driven, min 20 meters
  extruded: true,
  getFillColor: d => [d.r, d.g, d.b, 200]
});
```

### Example 3: Using `radiusUnits` for Pixel vs. Meter Sizing
```js
const layer = new ColumnLayer({
  id: 'pixel-radius',
  data: myData,
  getPosition: d => [d.lng, d.lat],
  getElevation: d => d.value * 100,
  radius: 20,
  radiusUnits: 'pixels', // Each column base is 20 pixels wide, regardless of zoom
  extruded: true,
  getFillColor: [100, 200, 255, 180]
});
```

### Example 4: Adjusting `coverage` for Proportional Shrinking
```js
const layer = new ColumnLayer({
  id: 'coverage-demo',
  data: myData,
  getPosition: d => [d.lng, d.lat],
  getElevation: d => d.value * 100,
  radius: 100,
  coverage: 0.5, // All columns are half their normal base radius
  extruded: true,
  getFillColor: [120, 120, 220, 180]
});
```

### Example 5: Combining `radius`, `coverage`, and `elevationScale`
```js
const layer = new ColumnLayer({
  id: 'combined-demo',
  data: myData,
  getPosition: d => [d.lng, d.lat],
  getElevation: d => d.value * 100,
  radius: d => Math.max(d.importance * 50, 10),
  coverage: 0.7,
  elevationScale: 2,
  extruded: true,
  getFillColor: [255, 180, 60, 200]
});
```

---

## 3. Troubleshooting & Gotchas

- **If radius changes have no visible effect:**
  - Ensure you are using the `radius` property (not `getRadius`).
  - Check `radiusUnits`—if set to `'meters'`, columns may appear very small or large depending on zoom.
  - Try `radiusUnits: 'pixels'` for screen-space sizing.
  - Use `coverage` to further shrink columns if needed.
  - There is no documented `minRadius` or `radiusScale` for ColumnLayer; all scaling must be done via `radius` or `coverage`.
  - Rendering context (MapboxOverlay, MapTiler, WebGL) may impose practical minimums for anti-aliasing or picking, but no hard clamping is documented.

- **diskResolution**: Higher values yield smoother columns but increase GPU cost.

- **extruded**: Must be `true` for 3D cylinders.

- **material**: Use for advanced lighting and shading effects.

---

## 4. Visual Diagram (Recommended)

Consider adding a diagram or annotated screenshot showing:
- The effect of `radius`, `coverage`, and `elevationScale` on the rendered cylinder.
- The difference between `radiusUnits: 'meters'` and `'pixels'`.

---

## 5. References & Further Reading

- [deck.gl ColumnLayer API Reference](../../deckgl doc/api-reference/layers/column-layer.md)
- [deck.gl Layer Overview](../../deckgl doc/api-reference/layers/README.md)
- [deck.gl Lighting & Material Guide](../../deckgl doc/developer-guide/using-effects.md#material-settings)
- [deck.gl Source Code (GitHub)](https://github.com/visgl/deck.gl)
- [deck.gl Issues: ColumnLayer](https://github.com/visgl/deck.gl/issues?q=columnlayer)

---

## 6. Common Mistakes & Debugging Strategies

- Using `getRadius` instead of `radius` (ColumnLayer expects `radius`)
- Not setting `extruded: true` for 3D columns
- Forgetting to set `radiusUnits` appropriately for the visualization context
- Overlooking the effect of `coverage` on actual rendered size
- Expecting undocumented properties like `radiusScale` or `minRadius` to work

---

## 7. Minimal Reproducible Example

```js
import { ColumnLayer } from '@deck.gl/layers';

const columns = new ColumnLayer({
  id: 'minimal-example',
  data: [
    { position: [-122.4, 37.8], value: 10 },
    { position: [-122.41, 37.81], value: 20 }
  ],
  getPosition: d => d.position,
  getElevation: d => d.value * 100,
  radius: 50,
  extruded: true,
  getFillColor: [255, 100, 100, 200]
});
```

---

This document is intended as a living reference for anyone working with deck.gl’s ColumnLayer, with a focus on practical, reproducible control over 3D cylinder geometry and sizing.

# WebAR Interaction Features

This document catalogs the specific UX characteristics and micro-interactions implemented in the WebAR application to ensure a premium, intuitive experience.

## Object Interaction & Manipulation

### Scaling
- **Snapping:** The vertical scale slider includes a snapping mechanism. If the scale value is dragged within `±0.1` of `1.0` (i.e., between `0.9` and `1.1`), the scale automatically snaps to exactly `1.0`. This makes it effortless to return an object to its native, unscaled size without needing a dedicated reset button.
- **Mouse Drag Scaling Rate:** When dragging the mouse vertically to scale an object in the 3D viewport, the scaling factor is calculated as `1 - deltaY * 0.005`. This creates a smooth, proportional scaling experience that feels controlled, preventing objects from blowing up too quickly or shrinking too slowly.
- **Constraints:** Scale is clamped between a minimum of `0.25x` and a maximum of `3.0x` to prevent objects from becoming unmanageably small or breaking the camera boundaries.

### Rotation
- **Mouse Drag Rotation Rate:** When dragging the mouse horizontally or vertically in `ROTATE` mode, the object rotates at a rate of `deltaX * 0.01` (Y-axis rotation) and `deltaY * 0.01` (X-axis rotation). This `0.01` multiplier translates pixel movement into radians smoothly, ensuring 1:1 feel between cursor movement and object rotation.

### Translation (Moving)
- **Raycast Plane Binding:** When moving an object, the interaction calculates the exact 3D point where the user clicked the mesh (`dragPlaneYRef.current = hitPoint.y`). It casts a ray against a horizontal 3D plane at that exact height.
- **Offset Preservation:** An offset vector (`offsetRef`) between the object's origin and the click point is preserved. This means if you click the edge of a chair, the chair won't instantly snap its center to your mouse. Instead, you drag it by the edge you grabbed, creating a highly tactile, physical interaction model.

## UI/UX Characteristics

### Floating Navigation
- **Top Center Glassmorphism:** The main navigation pill floats at the top center of the screen using a heavy background blur (`backdrop-filter: blur(20px)`) to keep the UI legible over any lighting condition.
- **Dynamic Sliding:** If an object is selected, the top-right tool pills previously shifted left to avoid overlaps. In the new centered layout, all primary controls are consolidated in a neat row.

### Object Tools
- **Layered Z-Indexing:** Object manipulation UI elements (like the Scale slider and Tools pill) sit above the canvas but behind the full-screen Lightbox modals, maintaining clear depth hierarchy.
- **Visual Feedback:** All interactive buttons utilize CSS transitions (`transform: scale(1.05)`) on hover to provide immediate tactile feedback. 

## Scene Management
- **Empty State Guidance:** If a background scene is loaded but no objects are present, a massive, centered primary button guides the user to add an object.
- **Preloaded Previews:** Rather than hiding template scenes behind a click, the empty state proactively displays them in a grid so users can rapidly prototype without uploading their own images.

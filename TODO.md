### Perspective
- straight on
- angled

### Models
- https://copilot.microsoft.com/labs/experiments/3d-generations
- https://chevous.ca/

## 1. Multi-Object Support
- [ ] Allow users to place multiple objects in the scene.
- [ ] Select, move, rotate, and scale individual objects independently.
- [ ] Update `FloatingControls` to apply transformations to the currently selected object.

## 2. Realistic Shadows (Shadow Catcher)
- [ ] Add an invisible `ContactShadows` or shadow-catching plane under the 3D models.
- [ ] Ensure the shadow blends realistically with the uploaded 2D background photo.

## 3. "Export / Save Photo" Functionality
- [ ] Add a "Download Snapshot" button.
- [ ] Implement logic to merge the 3D canvas rendering and the 2D background image into a single downloadable JPEG/PNG.

## 4. Ambient Light Matching
- [ ] Sample dominant colors/brightness from the uploaded environment photo.
- [ ] Automatically adjust the 3D scene lighting (ambient, directional, or environment map) to match the photo's mood.

## 5. AI Depth Estimation (Smarter Backgrounds)
- [ ] Integrate a lightweight depth-estimation model (e.g., DepthAnything) to parse the uploaded 2D image.
- [ ] Automatically determine the floor plane and perspective so objects snap correctly without manual calibration.
### Perspective
- straight on
- angled

### Models
- https://copilot.microsoft.com/labs/experiments/3d-generations
- https://chevous.ca/

### Future
- payments

### Features
- import 2d image to 3d model
- saved configurations
- ai perspective analyzer

## 2. Realistic Shadows (Shadow Catcher)
- [ ] Add an invisible `ContactShadows` or shadow-catching plane under the 3D models.
- [ ] Ensure the shadow blends realistically with the uploaded 2D background photo.

## 5. AI Depth Estimation (Smarter Backgrounds)
- [ ] Integrate a lightweight depth-estimation model (e.g., DepthAnything) to parse the uploaded 2D image.
- [ ] Automatically determine the floor plane and perspective so objects snap correctly without manual calibration.


## Split

okay so overall i want this as a thing that you just pass in the image + model, and it handles the rest for you

so it should be able to run on any env like on a website, or shipify or an app right? just separate the code cleanly and make it a clean interface. how do we do that


## fix
[browser] WARNING: Multiple instances of Three.js being imported. (https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js:17:541893)
[browser] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
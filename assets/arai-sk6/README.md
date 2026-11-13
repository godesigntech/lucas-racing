# Arai SK-6 template guide

Read from the Arai model open in Blender 5.2 (unsaved session, via its autosave), object `HELMET SHELL`, UV map `UVMap`.

## Model size (Blender units = metres)

| | Width (X) | Length (Y, front to back) | Height (Z) |
|---|---|---|---|
| Shell | 51.85 cm | 68.37 cm | 55.81 cm |

The model is about twice life size (a real SK-6 shell is roughly 26-28 cm wide). Proportions are what matter for the template.

## UV layout (4096 x 4096 sheet, top of image = v 1)

| Piece | u | v | On a 4096 sheet (px) |
|---|---|---|---|
| Main shell: two side lobes + chin band | 0.0228 - 0.9772 | 0.3229 - 0.6771 | x 93 - 4003, y 1322 - 2773 |
| Lower rim strips (left / right) | 0.024 - 0.477 / 0.517 - 0.970 | 0.22 - 0.41 | below the chin band |
| Side pivot recesses (left / right) | 0.116 - 0.246 / 0.753 - 0.884 | 0.376 - 0.450 | inside the lower corners of the band |
| Vent holes | collapsed at 0,0 | | not paintable |

The main shell band is **3909 x 1451 px** on a 4096 sheet (about 2.69 : 1).
For `scripts/prepare-artwork-templates.mjs` that is
`SHELL_BAND = { left: 0.0228, top: 0.3229, right: 0.9772, bottom: 0.6771 }`
(the Bell KC7 band is `{ left: 0.003, top: 0.301, right: 0.997, bottom: 0.688 }`).

## Files

- `arai-sk6-shell-guide.svg / .png`: outline of the shell only, cropped to the band (3909 x 1451). Draw designs on this.
- `arai-sk6-shell-guide-mesh.svg / .png`: the same, with the mesh in light grey to show stretch.
- `arai-sk6-uv-full-4096.svg / .png`: every UV piece on the full square sheet.

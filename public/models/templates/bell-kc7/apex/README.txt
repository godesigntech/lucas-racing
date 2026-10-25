APEX — APPROVAL EDITION 01
Bell KC7 racing-template package. Apex only; Twin Stripe and Split Tone await approval.

MODEL / MATCHING TEXTURES
Bell_KC7_Apex_matching.glb is a byte-identical copy of the supplied
Bell_KC7_customizable.glb. Geometry, scale, orientation, names, UVs, separate
accessory materials, visor and its hinge are unchanged. The GLB retains neutral
materials: apply the accompanying masks in your website shader to see Apex.
SHA-256: a7441337ce9dace4f523e3bf44c269eb96afdc1f5706b987ac00d08206416723
Shell Mesh.name: Shell. Material.name: M_Shell.
UV set: TEXCOORD_0 (Three.js geometry.attributes.uv).
The matching GLB and both masks must be used together. No UV changes were made.
The shell retains its existing non-overlapping, non-mirrored multi-island UVs.
The artwork is visually bilateral, but the UV pixels are independent, so you can
edit left/right designs, names and numbers separately. No names or logos included.

MASKS AND COMPOSITING
Apex/graphic-mask.png and Apex/accent-mask.png: aligned 2048 x 2048 grayscale PNGs.
White = region selected; black = not selected. Intermediate values anti-alias edges.
Priority: accent over graphic over base. Read masks as linear data, NOT sRGB.
G = graphic-mask.r; A = accent-mask.r
baseWeight    = (1-A)*(1-G)
graphicWeight = (1-A)*G
accentWeight  = A
result = baseWeight*baseSurface + graphicWeight*graphicSurface + accentWeight*accentSurface
Each surface can be a colour or independently sampled hydro-dip/chrome treatment.
The designed interiors do not overlap. Filtering/gutters can produce fractional
overlap; the priority rule above resolves it. Apply masks ONLY to Shell/M_Shell.
Do not apply them to the visor, trim, vents, screws or interior.
With Three.js TextureLoader, set each mask.flipY=false and colorSpace=NoColorSpace
for this glTF UV convention. Use clamp-to-edge wrapping and linear filtering.
The GLB itself contains no racing-design textures or baked preview colours.

ARTWORK AND UV PADDING
The artwork is defined continuously in model surface space, then rasterized into
the actual shell UV triangles at 4096 px and downsampled to 2048 px.
UV islands receive up to 12 px of gutter padding at final resolution; expansion
stops where neighboring island gutters meet. Mesh texels are not overwritten.
UV seam checks compare 14,112 edge samples per mask; see mask_QA.json.
Tiny edge differences from sampling/anti-aliasing remain at some graphic crossings.
Visually review the supplied views at the intended browser display size; a browser
device/mipmap performance test has not been run. Shell UVs have not been repacked.

EDITABLE SOURCE
Apex_Artwork.blend: the exact model with packed masks and an editable Shell node
material. Change BASE_COLOUR, GRAPHIC_COLOUR and ACCENT_COLOUR RGB nodes to recolour.
Other materials remain as imported. The optional spoiler is hidden for approval
renders to expose the rear shell; it remains present in the GLB and source scene.
apex_design.json: editable sweep heights, widths, crown profile, stripe gap/width.
make_masks.py: rebuilds both masks from those parameters and shell_surface.npz.
Requires Python, numpy and Pillow. Run from any directory; paths are script-relative.
render_apex.py: Blender background script recreating the artwork project and all
six views from the matching GLB and masks. This script uses the preview palette.
verify_masks.py: mask dimensions, seam sample checks and approval-sheet generator.
shell_surface.npz: positions and UV triangles extracted from the actual Shell.
Example rebuild:
  python make_masks.py
  blender --background --factory-startup --python render_apex.py
  python verify_masks.py

APPROVAL VIEWS
Apex/thumbnail.png: three-quarter; front.png, rear.png, left.png, right.png, top.png.
Left/right are the wearer's left/right. Top has the helmet rear at image top.
Apex_approval_sheet.jpg combines all views. White/blue/red are sample colours only.
shell-uv-wireframe.png is 2048 x 2048, aligned to the masks (all shell triangle edges).

SCOPE
This package preserves the supplied simplified KC7 geometry; it does not certify
physical accuracy or add the previously pending BulletZ accessories. No external
base mesh or purchased artwork was used. Template masks contain no lighting,
reflections, shadows, logos or lettering. Source scripts and Blender project included.

# Haven — The Oak Residences

A marketing site for an illustrative fifteen-storey tower. One full-floor apartment, Residence 11A on level 11, is fully furnished and walkable in real-time 3D, including its balcony with an egg chair and a porch swing.

```bash
npm install
npm run dev      # http://localhost:5180
```

- `/` is the editorial listing page: sketch-to-render hero, overview, room by room, floor plans, gallery, viewing enquiry.
- `/tour` is the first-person walkthrough. `/tour?room=<id>` deep-links to a room (ids are in `src/data/houseLayout.ts`).
- `/studio` (dev only) re-renders every image in `public/images` from the 3D model. Use it after you change the model.

## One source of truth

`src/data/houseLayout.ts` holds the tower dimensions and, for Residence 11A, every room rectangle, door, window, the balcony and all furniture.
`src/data/layoutGeometry.ts` derives the walls from it. The walls are the space left between rooms. The SVG plans, the 3D scene,
the collision map and the in-tour **Model checks** panel are all built from these two files.

## Photoreal renders (Blender)

The room and tower photos are Blender Cycles renders of the same model you walk:

1. `npm run dev`, open `/studio`, click **Export for Blender**. This writes the model to `blender/export/`
   (the merged `tower.glb`, plus `shell.glb` and item-by-item `furniture.glb`) with the camera views and lamp positions.
2. `python blender/fetch_assets.py` downloads the CC0 furniture and decor models from Poly Haven into
   `blender/assets/` (about 150 MB, checksums verified). `blender/furnish.py` swaps the web model's
   low-poly sofas, chairs, tables, plants and pendants for them and dresses the rooms; run the
   renderer with `--no-cc0` to skip this.
3. Render (GPU/OptiX is picked up automatically):

   ```bash
   blender -b -P blender/render.py
   blender -b -P blender/render.py -- --views living,balcony --scale 0.5 --samples 128   # quick test
   ```

The script upgrades the model for path tracing (bevelled edges, real glass, metals, fabric sheen,
physical sky, warm lamps), saves `blender/out/oak-residences.blend` for hand-tuning, and writes the
WebP stills to `public/images`. The hero's sketch layers (`hero-lines`, `hero-tone`) still come from
the studio's **Render all**, using the same camera, so they line up with the Blender render.

## Enquiries

`POST /api/enquiry` is served by a Vite middleware (`server/enquiryApi.ts`) in dev and `vite preview`. It validates with the
same Zod schema as the form and appends records to `data/enquiries.json`. For production hosting, move `handleEnquiry`
into your platform's serverless function and swap the JSON file for a database.

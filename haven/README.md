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

## Enquiries

`POST /api/enquiry` is served by a Vite middleware (`server/enquiryApi.ts`) in dev and `vite preview`. It validates with the
same Zod schema as the form and appends records to `data/enquiries.json`. For production hosting, move `handleEnquiry`
into your platform's serverless function and swap the JSON file for a database.

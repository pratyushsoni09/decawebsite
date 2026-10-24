import { AREAS, CEILING_HEIGHT, TOWER } from "./houseLayout";

export const RENDER_LABEL = "Illustrative render of the 3D model";
/** Mood images that set the intended style of a room; they are not of Residence 11A itself. */
export const CONCEPT_LABEL = "Interior concept image";

export interface FeaturedRoom {
  num: string;
  id: string;
  name: string;
  description: string;
  chips: [string, string, string];
  image: string;
  alt: string;
  /** badge for the image; defaults to RENDER_LABEL */
  label?: string;
  /** CSS object-position when the image is cropped to the portrait frame */
  focus?: string;
}

export const featuredRooms: FeaturedRoom[] = [
  {
    num: "01", id: "living", name: "Hall",
    description: "The heart of the home: two espresso-brown sofas face each other across a round black coffee table on a grey shag rug, in front of a warm wood-veneer feature wall with a large marbled painting, black shelving lit in a dark recess and a floating console. Bulb pendants, an arc lamp, dark wood floors, and tall glass doors and windows onto the balcony.",
    chips: ["7.03 × 6.55 m", "Wood-veneer feature wall", "Opens to the balcony"],
    image: "/images/concepts/hall-warm.webp", alt: "Living room with two sofas facing a warm wood-panelled wall with a large abstract painting", label: CONCEPT_LABEL,
  },
  {
    num: "02", id: "dining", name: "Dining hall",
    description: "You step straight into the dining hall: a thick driftwood slab table for six with black upholstered chairs under a bar of glass pendants, a crockery sideboard, a shoe cabinet by the door — and the family's pooja unit standing open against the wall.",
    chips: ["5.75 × 5.05 m", "Dining for six", "Open pooja unit"],
    image: "/images/concepts/kitchen-dining.webp", alt: "Open kitchen and dining table under glass pendants, with the city lit up beyond the windows", label: CONCEPT_LABEL,
  },
  {
    num: "03", id: "kitchen", name: "Kitchen",
    description: "Handleless grey-brown wood cabinets under a quartz counter, a charcoal wall behind the glass hob and chimney, a wood appliance column with a built-in fridge, oven and microwave, and a quartz waterfall island with two counter stools under twin pendants. A wide archway opens it to the dining hall.",
    chips: ["3.8 × 3.3 m", "Quartz waterfall island", "Wood appliance column"],
    image: "/images/kitchen.webp", alt: "Luxury kitchen with a quartz waterfall island, counter stools and a walnut appliance column",
  },
  {
    num: "04", id: "master", name: "Master bedroom",
    description: "A sculpted pink leather bed under a softly lit canopy, with mustard sheets and a maroon throw; a pink swivel chair and ottoman on a rose rug, dark polished floors, a wardrobe bay, its own bathroom and glass doors to the balcony.",
    chips: ["4.3 × 4.3 m", "Sculpted canopy bed", "Opens to the balcony"],
    image: "/images/concepts/master-bedroom.webp", alt: "Bedroom with a sculpted pink bed under arched windows looking over hills", label: CONCEPT_LABEL, focus: "62% 50%",
  },
  {
    num: "05", id: "bed2", name: "Bedroom two",
    description: "Twin beds for two children against cream panelling, with an orange arch and a reading light behind each bed, a nightstand between them, a north window and a full-height wardrobe.",
    chips: ["4.3 × 4.6 m", "Twin beds", "Wardrobe with loft"],
    image: "/images/concepts/twin-bedroom.webp", alt: "Children's bedroom with twin beds against a curved orange feature wall", label: CONCEPT_LABEL,
  },
  {
    num: "06", id: "bed3", name: "Bedroom three",
    description: "A study bedroom: a grey upholstered bed with a rumpled duvet against a terracotta wall lined with a row of open shelf boxes, a long oak desk under the wide window with an orange chair, grey curtains and carpet tiles.",
    chips: ["4.3 × 3.75 m", "Desk under a wide window", "Terracotta shelf wall"],
    image: "/images/concepts/study-bedroom.webp", alt: "Bedroom with a study desk along the window and shelves on an orange wall", label: CONCEPT_LABEL,
  },
  {
    num: "07", id: "balcony", name: "Balcony & swings",
    description: "A teak balcony behind a frameless glass balustrade, shared by the hall and the master bedroom. A rattan egg chair and a teak porch swing hang at either end, with a table for two between planters.",
    chips: ["11.6 × 3.0 m", "Sit on the egg chair or porch swing", "Doors from two rooms"],
    image: "/images/balcony.webp", alt: "Teak balcony with a hanging rattan egg chair, planters and a glass balustrade",
  },
];

const internal = Math.round(AREAS.internal);
const balcony = Math.round(AREAS.balcony);

export const STATS = [
  { label: "Bedrooms", value: 3, display: "3" },
  { label: "Bathrooms", value: 2, display: "2" },
  { label: `Carpet area · ${Math.round(internal * 10.764).toLocaleString("en-GB")} sq ft`, value: internal, display: `${internal} m²`, suffix: " m²" },
  { label: "Balcony", value: balcony, display: `${balcony} m²`, suffix: " m²" },
  { label: "Storeys in the tower", value: TOWER.storeys, display: String(TOWER.storeys) },
  { label: "Ceiling height", value: CEILING_HEIGHT, display: `${CEILING_HEIGHT.toFixed(2)} m`, suffix: " m", decimals: 2 },
] as const;

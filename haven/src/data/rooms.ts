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
    description: "The heart of the home: a linen sofa and an armchair face a fluted oak TV wall, a false ceiling with a warm cove glows overhead, and a reading chair waits by the window. Wide glass doors open onto the balcony.",
    chips: ["7.03 × 6.55 m", "Fluted TV wall, cove ceiling", "Opens to the balcony"],
    image: "/images/concepts/hall-warm.webp", alt: "Living room with two sofas facing a warm wood-panelled wall with a large abstract painting", label: CONCEPT_LABEL,
  },
  {
    num: "02", id: "dining", name: "Dining hall",
    description: "You step straight into the dining hall: a six-seater table under two pendants, a crockery sideboard, a shoe cabinet by the door — and the family's pooja unit standing open against the wall, with no room or door around it.",
    chips: ["5.75 × 5.05 m", "Dining for six", "Open pooja unit"],
    image: "/images/concepts/kitchen-dining.webp", alt: "Open kitchen and dining table under glass pendants, with the city lit up beyond the windows", label: CONCEPT_LABEL,
  },
  {
    num: "03", id: "kitchen", name: "Kitchen",
    description: "A luxury modular kitchen: handleless greige cabinets under a quartz counter and full-height quartz splashback, a glass hob below the chimney, a walnut appliance column with a built-in fridge, oven and microwave, and a quartz waterfall island with two counter stools under twin pendants. A wide archway opens it to the dining hall.",
    chips: ["3.8 × 3.3 m", "Quartz waterfall island", "Walnut appliance column"],
    image: "/images/kitchen.webp", alt: "Luxury kitchen with a quartz waterfall island, counter stools and a walnut appliance column",
  },
  {
    num: "04", id: "master", name: "Master bedroom",
    description: "A king bed under a cove-lit false ceiling, a wardrobe bay at the entrance, its own bathroom with a glass shower, and glass doors to the balcony.",
    chips: ["4.3 × 4.3 m", "Attached bathroom", "Opens to the balcony"],
    image: "/images/concepts/master-bedroom.webp", alt: "Bedroom with a sculpted pink bed under arched windows looking over hills", label: CONCEPT_LABEL, focus: "62% 50%",
  },
  {
    num: "05", id: "bed2", name: "Bedroom two",
    description: "A calm double bedroom with a north window and a full-height wardrobe with loft storage, next to the common bathroom.",
    chips: ["4.3 × 4.6 m", "Double bed", "Wardrobe with loft"],
    image: "/images/concepts/twin-bedroom.webp", alt: "Children's bedroom with twin beds against a curved orange feature wall", label: CONCEPT_LABEL,
  },
  {
    num: "06", id: "bed3", name: "Bedroom three",
    description: "A study bedroom for a child or a home office: a desk under the west window, a single bed and a wardrobe.",
    chips: ["4.3 × 3.75 m", "Study desk by the window", "Bed and wardrobe"],
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

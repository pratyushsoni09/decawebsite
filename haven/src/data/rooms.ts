import { AREAS, CEILING_HEIGHT, TOWER } from "./houseLayout";

export const RENDER_LABEL = "Illustrative render of the 3D model";

export interface FeaturedRoom {
  num: string;
  id: string;
  name: string;
  description: string;
  chips: [string, string, string];
  image: string;
  alt: string;
}

export const featuredRooms: FeaturedRoom[] = [
  {
    num: "01", id: "living", name: "Hall",
    description: "The heart of the home: a linen sofa and an armchair face a fluted oak TV wall, a false ceiling with a warm cove glows overhead, and a reading chair waits by the window. Wide glass doors open onto the balcony.",
    chips: ["7.03 × 6.55 m", "Fluted TV wall, cove ceiling", "Opens to the balcony"],
    image: "/images/living.webp", alt: "Hall with a linen sofa facing a fluted oak TV wall under a cove-lit false ceiling",
  },
  {
    num: "02", id: "dining", name: "Dining hall",
    description: "You step straight into the dining hall: a six-seater table under two pendants, a crockery sideboard, a shoe cabinet by the door — and the family's pooja unit standing open against the wall, with no room or door around it.",
    chips: ["5.75 × 5.05 m", "Dining for six", "Open pooja unit"],
    image: "/images/dining.webp", alt: "Dining hall with a six-seater table and an open teak pooja unit against the wall",
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
    image: "/images/master.webp", alt: "Master bedroom with a king bed and cove-lit ceiling",
  },
  {
    num: "05", id: "bed2", name: "Bedroom two",
    description: "A calm double bedroom with a north window and a full-height wardrobe with loft storage, next to the common bathroom.",
    chips: ["4.3 × 4.6 m", "Double bed", "Wardrobe with loft"],
    image: "/images/bed2.webp", alt: "Bedroom with a double bed and a full-height wardrobe",
  },
  {
    num: "06", id: "bed3", name: "Bedroom three",
    description: "A study bedroom for a child or a home office: a desk under the west window, a single bed and a wardrobe.",
    chips: ["4.3 × 3.75 m", "Study desk by the window", "Bed and wardrobe"],
    image: "/images/bed3.webp", alt: "Bedroom with a study desk under the window and a single bed",
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

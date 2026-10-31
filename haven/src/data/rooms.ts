import { AREAS, CEILING_HEIGHT, TOWER } from "./houseLayout";

export const RENDER_LABEL = "Illustrative render of the 3D model";
/** Mood images that set the intended style of a room; they are not of Residence 11A itself. */
export const CONCEPT_LABEL = "Interior concept image";
export const STYLE = "Warm modern Indian luxury: walnut and brass, fluted panels, ivory marble, boucle and rust velvet, jaali screens and warm cove light.";

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
    description: "The heart of the home, in walnut and brass: a fluted walnut feature wall with an ivory marble centre, brass-lit shelves and a floating marble console; two ivory boucle sofas face each other across a round marble table on an ivory rug, with a rust velvet chair at the end. Brass globe pendants, a brass arc lamp, ivory marble floors and tall glass doors onto the balcony.",
    chips: ["7.03 × 6.55 m", "Fluted walnut and marble wall", "Opens to the balcony"],
    image: "/images/living.webp", alt: "Hall with two ivory boucle sofas across a round marble table, facing a fluted walnut wall with a marble centre and brass-lit shelves",
  },
  {
    num: "02", id: "dining", name: "Dining hall",
    description: "You step straight into the dining hall: a walnut table on a sculptural brass base, set for six in ivory boucle chairs under a linear brass light with glass globes. The family mandir stands against the wall, walnut on a marble plinth with a brass jaali backdrop lit warm from behind, and the kitchen opens beyond.",
    chips: ["5.75 × 5.05 m", "Dining for six", "Walnut mandir with a jaali"],
    image: "/images/dining.webp", alt: "Dining hall with a walnut table set for six in ivory boucle chairs under a linear brass light, the walnut mandir lit behind",
  },
  {
    num: "03", id: "kitchen", name: "Kitchen",
    description: "An open kitchen in ivory and walnut: handleless ivory base units under an ivory marble counter and splashback, walnut uppers with brass pulls lit from beneath, a walnut appliance column, and a fluted walnut island with a marble waterfall top and two brass counter stools facing the dining hall.",
    chips: ["3.8 × 3.3 m", "Open to the dining hall", "Marble waterfall island"],
    image: "/images/kitchen.webp", alt: "Kitchen with ivory units, an ivory marble counter, walnut uppers and a fluted walnut island with brass stools",
  },
  {
    num: "04", id: "master", name: "Master bedroom",
    description: "An ivory boucle bed against a full-width fluted walnut headboard wall with brass strips, reading sconces and a warm cove; walnut-and-brass nightstands, a rust velvet chair and brass ottoman by the arched windows, a walnut dresser with a marble top, a fluted wardrobe bay, its own bathroom and glass doors to the balcony.",
    chips: ["4.3 × 4.3 m", "Fluted walnut headboard wall", "Opens to the balcony"],
    image: "/images/master.webp", alt: "Master bedroom with an ivory boucle bed against a fluted walnut wall with brass strips and sconces, a rust velvet chair by arched windows",
  },
  {
    num: "05", id: "bed2", name: "Bedroom two",
    description: "The guest room: two single beds with cane headboards in oak frames and sage linen, against a wall of oak slats over sage panels with brass sconces at each bed head; a walnut shelf niche, a jute rug, a sage window seat, a coffered ceiling with light strips and a fluted oak wardrobe.",
    chips: ["4.3 × 4.6 m", "Twin cane beds", "Window seat"],
    image: "/images/bed2.webp", alt: "Bedroom two with two cane-headboard single beds in sage linen against an oak slat wall with brass sconces",
  },
  {
    num: "06", id: "bed3", name: "Bedroom three",
    description: "A study bedroom: an oak bed with a beige linen headboard under walnut slats, a brass jaali panel glowing beside it and floating walnut shelves; a long walnut desk on brass sled legs under the wide window with an ivory boucle chair, ivory drapes on brass rods and warm oak floors.",
    chips: ["4.3 × 3.75 m", "Desk under a wide window", "Brass jaali wall"],
    image: "/images/bed3.webp", alt: "Bedroom three with an oak bed below walnut slats and a lit brass jaali panel, a long walnut desk under the window",
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

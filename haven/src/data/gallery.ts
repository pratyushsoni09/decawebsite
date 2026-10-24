import { CONCEPT_LABEL } from "./rooms";

export interface GalleryImage {
  src: string;
  caption: string;
  alt: string;
  /** layout hint for the editorial grid */
  shape: "wide" | "tall" | "square";
  /** what the image is; renders of the 3D model unless marked as a concept image */
  label?: string;
}

const C = CONCEPT_LABEL;

export const gallery: GalleryImage[] = [
  { src: "/images/tower-golden.webp", caption: "The tower", alt: "The fifteen-storey Oak Residences tower with oak fins and glass balconies at golden hour", shape: "wide" },
  { src: "/images/concepts/living-library.webp", caption: "Living · library wall", alt: "Living room with a curved wooden library wall, a spiral stair and a large sectional sofa", shape: "tall", label: C },
  { src: "/images/concepts/hall-warm.webp", caption: "Hall", alt: "Living room with two sofas facing a warm wood-panelled wall with a large abstract painting", shape: "square", label: C },
  { src: "/images/concepts/master-bedroom.webp", caption: "Master bedroom", alt: "Bedroom with a sculpted pink bed under arched windows looking over hills", shape: "wide", label: C },
  { src: "/images/concepts/kitchen-dining.webp", caption: "Kitchen and dining", alt: "Open kitchen and dining table under glass pendants, with the city lit up beyond the windows", shape: "wide", label: C },
  { src: "/images/concepts/twin-bedroom.webp", caption: "Bedroom two", alt: "Children's bedroom with twin beds against a curved orange feature wall", shape: "square", label: C },
  { src: "/images/concepts/study-bedroom.webp", caption: "Bedroom three", alt: "Bedroom with a study desk along the window and shelves on an orange wall", shape: "square", label: C },
  { src: "/images/concepts/living-white.webp", caption: "Living · marble and light", alt: "White living room with marble walls, a low sectional sofa and full-height windows", shape: "wide", label: C },
  { src: "/images/concepts/lounge-evening.webp", caption: "Evening lounge", alt: "Lounge with grey sofas, table lamps and a ring chandelier in front of a curtained window", shape: "square", label: C },
  { src: "/images/kitchen.webp", caption: "Luxury kitchen", alt: "Kitchen with a quartz waterfall island, counter stools and a walnut appliance column", shape: "square" },
  { src: "/images/pooja.webp", caption: "Open pooja unit", alt: "Teak pooja unit standing open against the dining-hall wall, with brass bells and diyas", shape: "square" },
  { src: "/images/swing.webp", caption: "The porch swing", alt: "Teak porch swing on the balcony, looking out over the city", shape: "wide" },
  { src: "/images/tower-dusk.webp", caption: "At dusk", alt: "The tower at dusk with warm light in the windows", shape: "square" },
];

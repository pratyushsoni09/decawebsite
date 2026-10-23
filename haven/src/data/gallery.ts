export interface GalleryImage {
  src: string;
  caption: string;
  alt: string;
  /** layout hint for the editorial grid */
  shape: "wide" | "tall" | "square";
}

export const gallery: GalleryImage[] = [
  { src: "/images/tower-golden.webp", caption: "The tower", alt: "The fifteen-storey Oak Residences tower with oak fins and glass balconies at golden hour", shape: "wide" },
  { src: "/images/pooja.webp", caption: "Open pooja unit", alt: "Teak pooja unit standing open against the dining-hall wall, with brass bells and diyas", shape: "tall" },
  { src: "/images/tower-dusk.webp", caption: "At dusk", alt: "The tower at dusk with warm light in the windows", shape: "square" },
  { src: "/images/living.webp", caption: "Hall", alt: "Living room with a fluted oak TV wall and cove-lit false ceiling", shape: "tall" },
  { src: "/images/swing.webp", caption: "The porch swing", alt: "Teak porch swing on the balcony, looking out over the city", shape: "wide" },
  { src: "/images/kitchen.webp", caption: "Modular kitchen", alt: "White modular kitchen with quartz counter and chimney", shape: "square" },
  { src: "/images/bed2.webp", caption: "Bedroom two", alt: "Bedroom with a double bed and a full-height wardrobe", shape: "tall" },
  { src: "/images/master.webp", caption: "Master bedroom", alt: "Master bedroom with king bed", shape: "square" },
  { src: "/images/dining.webp", caption: "Dining hall", alt: "Dining hall with a six-seater table under two pendant lamps", shape: "wide" },
  { src: "/images/bed3.webp", caption: "Bedroom three", alt: "Study bedroom with desk and bookshelf", shape: "square" },
];

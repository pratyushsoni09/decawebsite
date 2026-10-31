export interface GalleryImage {
  src: string;
  caption: string;
  alt: string;
  /** layout hint for the editorial grid */
  shape: "wide" | "tall" | "square";
  /** what the image is; renders of the 3D model unless marked as a concept image */
  label?: string;
}

export const gallery: GalleryImage[] = [
  { src: "/images/tower-golden.webp", caption: "The tower", alt: "The fifteen-storey Oak Residences tower with oak fins and glass balconies at golden hour", shape: "wide" },
  { src: "/images/living.webp", caption: "Hall", alt: "Hall of the 3D model: ivory boucle sofas across a marble table, facing a fluted walnut wall with a marble centre and brass-lit shelves", shape: "wide" },
  { src: "/images/master.webp", caption: "Master bedroom", alt: "Master bedroom of the 3D model: an ivory boucle bed against a fluted walnut wall with brass strips and sconces", shape: "tall" },
  { src: "/images/dining.webp", caption: "Dining hall", alt: "Dining hall of the 3D model in the evening: a walnut table set for six in ivory boucle chairs under a linear brass light", shape: "wide" },
  { src: "/images/pooja.webp", caption: "The mandir", alt: "Walnut mandir on a marble plinth with a brass jaali backdrop lit from behind, brass bells, diyas and marigolds", shape: "square" },
  { src: "/images/kitchen.webp", caption: "Kitchen", alt: "Kitchen of the 3D model: ivory units under an ivory marble counter, walnut uppers and a fluted walnut island with brass stools", shape: "square" },
  { src: "/images/bed2.webp", caption: "Bedroom two", alt: "Bedroom two of the 3D model: cane-headboard single beds in sage linen against an oak slat wall with brass sconces", shape: "square" },
  { src: "/images/bed3.webp", caption: "Bedroom three", alt: "Bedroom three of the 3D model: an oak bed below walnut slats and a lit brass jaali, a long walnut desk under the window", shape: "square" },
  { src: "/images/balcony.webp", caption: "The balcony", alt: "Teak balcony with the rattan egg chair, planters and a glass balustrade over Kudasan", shape: "wide" },
  { src: "/images/swing.webp", caption: "The porch swing", alt: "Teak porch swing on the balcony, looking out over the city", shape: "wide" },
  { src: "/images/tower-dusk.webp", caption: "At dusk", alt: "The tower at dusk with warm light in the windows", shape: "square" },
];

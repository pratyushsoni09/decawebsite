/**
 * Real photographs of other Indian homes, used as interior inspiration.
 * They are not Residence 11A. All are free to use under the Unsplash License
 * (https://unsplash.com/license) and credited to their photographers.
 */
export interface InspirationPhoto {
  src: string;
  room: string;
  place: string | null;
  alt: string;
  photographer: string;
  /** Unsplash username, without the @ */
  username: string;
  /** Unsplash photo id */
  photoId: string;
}

export const inspiration: InspirationPhoto[] = [
  { src: "/images/inspiration/living-delhi.webp", room: "Living room", place: "New Delhi", alt: "Living room with curved white sofas, a marble-topped coffee table and a panelled wall", photographer: "Pyx Photography", username: "pyx_photo", photoId: "CgA03H9jCKw" },
  { src: "/images/inspiration/dining-pune.webp", room: "Dining room", place: "Pune", alt: "Six-seater dining table set for a meal beside a carved pooja unit", photographer: "Anisha Deb", username: "newleafdesigns", photoId: "M6e7bLEvgc8" },
  { src: "/images/inspiration/kitchen-island.webp", room: "Kitchen with island", place: null, alt: "Grey and white kitchen with an island under three pendant lights and built-in ovens", photographer: "Lotus Design N Print", username: "lotusdnp", photoId: "RwXneIyqxAw" },
  { src: "/images/inspiration/bedroom-chennai.webp", room: "Master bedroom", place: "Chennai", alt: "Bedroom with an upholstered headboard, a backlit wall panel and a silk bed runner", photographer: "Dinesh Lunked", username: "idlunked", photoId: "aFN7TUiUqFg" },
  { src: "/images/inspiration/bedroom-pune-window.webp", room: "Bedroom with window seat", place: "Pune", alt: "Bedroom with a cushioned window seat looking over trees and a study corner", photographer: "Anisha Deb", username: "newleafdesigns", photoId: "f3PCSqsQ-E4" },
  { src: "/images/inspiration/wardrobe-chennai.webp", room: "Wardrobe wall", place: "Chennai", alt: "Bedroom with full-height wardrobes either side of a window and a cove-lit ceiling", photographer: "Dinesh Lunked", username: "idlunked", photoId: "Ez_z38VgA4c" },
  { src: "/images/inspiration/bedroom-pune-panel.webp", room: "Guest bedroom", place: "Pune", alt: "Bedroom with an olive geometric wall panel, a wooden bed and a large window", photographer: "Anisha Deb", username: "newleafdesigns", photoId: "mfFyocD9ttI" },
  { src: "/images/inspiration/balcony-swing.webp", room: "Balcony swing", place: null, alt: "Hanging egg chair on an apartment balcony at dusk, with towers beyond", photographer: "Aditya Kumar", username: "adityamr7", photoId: "xBY2meaQ_os" },
];

const UTM = "utm_source=haven-oak-residences&utm_medium=referral";
export const photographerUrl = (p: InspirationPhoto) => `https://unsplash.com/@${p.username}?${UTM}`;
export const photoUrl = (p: InspirationPhoto) => `https://unsplash.com/photos/${p.photoId}?${UTM}`;

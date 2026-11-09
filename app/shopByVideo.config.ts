export type ShopVideo = {
  id: string;
  title: string;
  url: string;
  displayOrder: number;
  videoSrc?: string;
  posterSrc?: string;
};

// Add videoSrc (and optionally posterSrc) after each video is uploaded to S3.
// Until then, Shop by Video displays "Coming soon" without Instagram embeds.
export const shopByVideoReels: ShopVideo[] = [
  { id: "DeriwyHteZQ", title: "Pebbles Reel 01", url: "https://www.instagram.com/reel/DeriwyHteZQ/", displayOrder: 1 },
  { id: "DfPq16kt3R9", title: "Pebbles Reel 02", url: "https://www.instagram.com/reel/DfPq16kt3R9/", displayOrder: 2 },
  { id: "DfAMf5KN6Uj", title: "Pebbles Reel 03", url: "https://www.instagram.com/reel/DfAMf5KN6Uj/", displayOrder: 3 },
  { id: "DfKkGBAtbd4", title: "Pebbles Reel 04", url: "https://www.instagram.com/reel/DfKkGBAtbd4/", displayOrder: 4 },
  { id: "DfSSQ8rN9d5", title: "Pebbles Reel 05", url: "https://www.instagram.com/reel/DfSSQ8rN9d5/", displayOrder: 5 },
  { id: "DffGMzPtu0-", title: "Pebbles Reel 06", url: "https://www.instagram.com/reel/DffGMzPtu0-/", displayOrder: 6 },
];

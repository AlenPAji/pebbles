export type ShopVideo = {
  id: string;
  title: string;
  url: string;
  displayOrder: number;
  videoSrc?: string;
  posterSrc?: string;
};

export const shopByVideoReels: ShopVideo[] = [
  { id: "IMG_0250", title: "Pebbles look 01", url: "https://www.instagram.com/pebblesboutique2024/", displayOrder: 1, videoSrc: "/videos/pebbles-reel-01.mp4" },
  { id: "IMG_0251", title: "Pebbles look 02", url: "https://www.instagram.com/pebblesboutique2024/", displayOrder: 2, videoSrc: "/videos/pebbles-reel-02.mp4" },
  { id: "IMG_0252", title: "Pebbles look 03", url: "https://www.instagram.com/pebblesboutique2024/", displayOrder: 3, videoSrc: "/videos/pebbles-reel-03.mp4" },
  { id: "IMG_0253", title: "Pebbles look 04", url: "https://www.instagram.com/pebblesboutique2024/", displayOrder: 4, videoSrc: "/videos/pebbles-reel-04.mp4" },
  { id: "SAVEVID-05", title: "Pebbles look 05", url: "https://www.instagram.com/pebblesboutique2024/", displayOrder: 5, videoSrc: "/videos/pebbles-reel-05.mp4" },
];

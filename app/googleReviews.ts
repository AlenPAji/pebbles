export interface GoogleReview {
  id: number;
  name: string;
  review: string;
  rating: number;
  date?: string;
  photo?: string;
}

export const googleOverallRating = 4.9;

export const googleReviews: GoogleReview[] = [
  {
    id: 1,
    name: "Praisy joy",
    review:
      "My happiest place for shopping outfits is Pebbles Boutique. Customer since 2024 , found good dress at affordable price. Hospitality is really appreciable ❤️❤️❤️",
    rating: 5,
    photo: "/images/praisy.png",
  },
  {
    id: 2,
    name: "Devika Shaji",
    review:
      "Beautiful collections and great quality! ❤️ The designs are trendy, elegant, and unique. Loved the overall shopping experience. Highly recommended.",
    rating: 5,
  },
  {
    id: 3,
    name: "kavya a biju",
    review:
      "Had a wonderful experience at Pebbles Boutique. Beautiful collections, a lovely ambience, and such a warm shopping experience. Every piece has its own little story, and I truly enjoyed finding mine.",
    rating: 5,
    photo: "/images/Kavya.png",
  },
  {
    id: 4,
    name: "Elizabeth sibi",
    review:
      "I'm honestly impressed! by pebbles Boutique💖 The fit is flattering, the fabric feels good quality, and it looks just like the picture packaging is also good Definitely happy with my purchase and would order again! …",
    rating: 5,
    photo: "/images/Elizabeth.png",
  },
  {
    id: 5,
    name: "Anjana Sai P",
    review:
      "Nice collections, very good customer service, Budget friendly kurtis",
    rating: 5,
    photo: "/images/Anjana.png",
  },
];

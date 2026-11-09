import Image from "next/image";

export function WearOurStory() {
  return <section className="wear-our-story" aria-label="The Pebbles Boutique banner">
    <Image
      className="wear-our-story-banner"
      src="/images/pebbles_banner_4.47_to_1.webp"
      alt="The Pebbles Boutique at Kulakkada, Kollam, Kerala, with a clothing display and an illustration of the boutique storefront"
      width={1920}
      height={429}
      sizes="100vw"
      loading="lazy"
      unoptimized
    />
  </section>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

type ScrollEditorialProps = {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  ctaHref: string;
  ctaLabel: string;
};

export function ScrollEditorial({ imageSrc, imageAlt, eyebrow, title, description, ctaHref, ctaLabel }: ScrollEditorialProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const targetSection: HTMLElement = section;

    let disposed = false;
    let revert: (() => void) | undefined;

    async function setupAnimation() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      revert = () => media.revert();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const frame = targetSection.querySelector<HTMLElement>(".scroll-editorial-frame");
        const image = targetSection.querySelector<HTMLElement>(".scroll-editorial-image");
        const shade = targetSection.querySelector<HTMLElement>(".scroll-editorial-shade");
        const eyebrowEl = targetSection.querySelector<HTMLElement>(".scroll-editorial-eyebrow");
        const heading = targetSection.querySelector<HTMLElement>(".scroll-editorial-heading");
        const descriptionEl = targetSection.querySelector<HTMLElement>(".scroll-editorial-description");
        const cta = targetSection.querySelector<HTMLElement>(".scroll-editorial-cta");
        if (!frame || !image || !shade || !eyebrowEl || !heading || !descriptionEl || !cta) return;

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: targetSection,
            start: "top bottom",
            end: "top top",
            scrub: 0.45,
            invalidateOnRefresh: true
          }
        });

        timeline
          .fromTo(frame, { scale: 0.86, yPercent: 7, opacity: 0.25 }, { scale: 1, yPercent: 0, opacity: 1, duration: 0.72 }, 0)
          .fromTo(image, { scale: 1.14 }, { scale: 1, duration: 1 }, 0)
          .fromTo(shade, { opacity: 0.35 }, { opacity: 1, duration: 0.55 }, 0.28)
          .fromTo(eyebrowEl, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.22 }, 0.38)
          .fromTo(heading, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.27 }, 0.49)
          .fromTo(descriptionEl, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.24 }, 0.62)
          .fromTo(cta, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.22 }, 0.76);
      });
    }

    void setupAnimation();

    return () => {
      disposed = true;
      revert?.();
    };
  }, []);

  return (
    <section className="scroll-editorial" ref={sectionRef} aria-label={eyebrow}>
      <div className="scroll-editorial-frame">
        <Image className="scroll-editorial-image" src={imageSrc} alt={imageAlt} fill sizes="100vw" quality={85} />
        <div className="scroll-editorial-shade" aria-hidden="true" />
        <div className="scroll-editorial-copy">
          <p className="scroll-editorial-eyebrow">{eyebrow}</p>
          <h2 className="scroll-editorial-heading">{title}</h2>
          <p className="scroll-editorial-description">{description}</p>
          <Link className="button scroll-editorial-cta" href={ctaHref}>{ctaLabel}<span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}

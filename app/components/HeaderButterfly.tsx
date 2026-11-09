"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";

type Side = "cart" | "menu";
type Point = { x: number; y: number };
type Positions = Record<Side, Point>;

function place(button: HTMLButtonElement, point: Point) {
  button.style.left = `${point.x}px`;
  button.style.top = `${point.y}px`;
}

export function HeaderButterfly({
  headerRef,
  menuAnchorRef,
  cartAnchorRef,
}: {
  headerRef: RefObject<HTMLElement>;
  menuAnchorRef: RefObject<HTMLSpanElement>;
  cartAnchorRef: RefObject<HTMLSpanElement>;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const positionsRef = useRef<Positions | null>(null);
  const sideRef = useRef<Side>("cart");
  const destinationRef = useRef<Side | null>(null);
  const flightRef = useRef<Animation | null>(null);
  const wingRef = useRef<Animation | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const hoverArmedRef = useRef(true);
  const [side, setSide] = useState<Side>("cart");

  useEffect(() => {
    const header = headerRef.current;
    const menuAnchor = menuAnchorRef.current;
    const cartAnchor = cartAnchorRef.current;
    const button = buttonRef.current;
    if (!header || !menuAnchor || !cartAnchor || !button) return;

    const measure = () => {
      const headerRect = header.getBoundingClientRect();
      const centerOn = (anchor: HTMLElement): Point => {
        const rect = anchor.getBoundingClientRect();
        return {
          x: rect.left - headerRect.left + (rect.width - button.offsetWidth) / 2,
          y: rect.top - headerRect.top + (rect.height - button.offsetHeight) / 2,
        };
      };
      positionsRef.current = { cart: centerOn(cartAnchor), menu: centerOn(menuAnchor) };

      if (flightRef.current) {
        flightRef.current.cancel();
        wingRef.current?.cancel();
        flightRef.current = null;
        wingRef.current = null;
        sideRef.current = destinationRef.current ?? sideRef.current;
        destinationRef.current = null;
        button.dataset.flying = "false";
        setSide(sideRef.current);
      }

      place(button, positionsRef.current[sideRef.current]);
      button.dataset.ready = "true";
    };

    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(header);
    observer?.observe(menuAnchor);
    observer?.observe(cartAnchor);
    window.addEventListener("resize", measure);
    const rearmHover = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hoverArmedRef.current = true;
    };
    header.addEventListener("pointerleave", rearmHover);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      header.removeEventListener("pointerleave", rearmHover);
      if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
      flightRef.current?.cancel();
      wingRef.current?.cancel();
    };
  }, [headerRef, menuAnchorRef, cartAnchorRef]);

  const flyTo = (destination: Side) => {
    const button = buttonRef.current;
    const positions = positionsRef.current;
    if (!button || !positions || flightRef.current || sideRef.current === destination) return;

    const from = positions[sideRef.current];
    const to = positions[destination];
    destinationRef.current = destination;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !button.animate) {
      place(button, to);
      sideRef.current = destination;
      destinationRef.current = null;
      setSide(destination);
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const lift = Math.min(20, Math.max(8, Math.abs(dx) * 0.04), Math.max(6, Math.min(from.y, to.y) - 2));
    const turn = dx < 0 ? -1 : 1;
    button.dataset.flying = "true";
    const flight = button.animate([
      { transform: "translate3d(0, 0, 0) rotate(0deg)", offset: 0 },
      { transform: `translate3d(${dx * 0.2}px, ${dy * 0.2 - lift * 0.7}px, 0) rotate(${turn * 3}deg)`, offset: 0.22 },
      { transform: `translate3d(${dx * 0.5}px, ${dy * 0.5 - lift}px, 0) rotate(0deg)`, offset: 0.5 },
      { transform: `translate3d(${dx * 0.82}px, ${dy * 0.82 - lift * 0.6}px, 0) rotate(${-turn * 2}deg)`, offset: 0.8 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(0deg)`, offset: 1 },
    ], { duration: 850, easing: "cubic-bezier(.22,.68,.3,1)", fill: "forwards" });
    flightRef.current = flight;
    if (imageRef.current) {
      wingRef.current = imageRef.current.animate([
        { transform: "scaleX(1)" },
        { transform: "scaleX(.8)" },
        { transform: "scaleX(1)" },
      ], { duration: 170, iterations: 5, easing: "ease-in-out" });
    }

    flight.onfinish = () => {
      if (flightRef.current !== flight) return;
      place(button, positionsRef.current?.[destination] ?? to);
      flightRef.current = null;
      flight.cancel();
      wingRef.current?.cancel();
      wingRef.current = null;
      button.dataset.flying = "false";
      sideRef.current = destination;
      destinationRef.current = null;
      setSide(destination);
    };
  };

  const clearHoverTimer = () => {
    if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  return (
    <button
      ref={buttonRef}
      className="header-butterfly"
      type="button"
      data-ready="false"
      data-flying="false"
      aria-label={side === "cart" ? "Move butterfly beside menu" : "Return butterfly beside cart"}
      aria-pressed={side === "menu"}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" || !hoverArmedRef.current || sideRef.current !== "cart") return;
        clearHoverTimer();
        hoverTimerRef.current = window.setTimeout(() => {
          hoverArmedRef.current = false;
          hoverTimerRef.current = null;
          flyTo("menu");
        }, 150);
      }}
      onPointerLeave={clearHoverTimer}
      onClick={() => {
        clearHoverTimer();
        hoverArmedRef.current = false;
        flyTo(sideRef.current === "cart" ? "menu" : "cart");
      }}
    >
      <Image ref={imageRef} src="/images/pebbles-mark-black-transparent.svg" alt="" width={20} height={22} priority unoptimized draggable={false} />
    </button>
  );
}

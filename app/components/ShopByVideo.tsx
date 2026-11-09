"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { shopByVideoReels, type ShopVideo } from "../shopByVideo.config";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let embedScriptPromise: Promise<void> | undefined;
let processQueued = false;

function loadInstagramScript() {
  if (window.instgrm?.Embeds) return Promise.resolve();
  if (!embedScriptPromise) {
    embedScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.dataset.instagramEmbed = "true";
      script.onload = () => window.instgrm?.Embeds ? resolve() : reject(new Error("Instagram embed unavailable"));
      script.onerror = () => reject(new Error("Instagram embed unavailable"));
      document.head.appendChild(script);
    });
  }
  return embedScriptPromise;
}

function processInstagramEmbeds() {
  if (processQueued) return;
  processQueued = true;
  requestAnimationFrame(() => {
    processQueued = false;
    window.instgrm?.Embeds.process();
  });
}

export function ShopVideoCard({ reel }: { reel: ShopVideo }) {
  const cardRef = useRef<HTMLElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "350px" });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearViewport || reel.videoSrc) return;
    const embed = embedRef.current;
    if (!embed) return;
    const placeholder = document.createElement("blockquote");
    placeholder.className = "instagram-media video-card-embed";
    placeholder.dataset.instgrmPermalink = reel.url;
    placeholder.dataset.instgrmVersion = "14";
    embed.replaceChildren(placeholder);
    let cancelled = false;
    setStatus("loading");
    const loaded = () => {
      if (!cancelled && embed.querySelector("iframe")) setStatus("ready");
    };
    const observer = new MutationObserver(loaded);
    observer.observe(embed, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => {
      if (!cancelled && !embed.querySelector("iframe")) setStatus("error");
    }, 15000);
    loadInstagramScript().then(() => {
      if (!cancelled) processInstagramEmbeds();
    }).catch(() => {
      if (!cancelled) setStatus("error");
    });
    loaded();
    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [nearViewport, reel.url, reel.videoSrc]);

  useEffect(() => {
    if (!reel.videoSrc || !nearViewport) return;
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) videoRef.current?.pause();
    }, { threshold: 0.25 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [nearViewport, reel.videoSrc]);

  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      await video.play();
    } catch {
      setVideoError(true);
    }
  }

  function handlePlay() {
    setIsPlaying(true);
    document.querySelectorAll<HTMLVideoElement>(".video-card-native").forEach((video) => {
      if (video !== videoRef.current) video.pause();
    });
  }

  return <article className="video-card" ref={cardRef} aria-label={reel.title}>
    <div className="video-card-frame">
      {reel.videoSrc ? <>
        {nearViewport && <video ref={videoRef} className="video-card-native" src={reel.videoSrc} poster={reel.posterSrc} preload="metadata" playsInline loop onPlay={handlePlay} onPause={() => setIsPlaying(false)} onError={() => setVideoError(true)} />}
        {!videoError && <button className={`video-card-control ${isPlaying ? "is-playing" : ""}`} type="button" onClick={toggleVideo} aria-label={`${isPlaying ? "Pause" : "Play"} ${reel.title}`}><span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span></button>}
        {videoError && <div className="video-card-placeholder is-error" role="status"><span>Video unavailable</span><a href={reel.url} target="_blank" rel="noopener noreferrer">View on Instagram ↗</a></div>}
      </> : <>
        <div className="video-card-embed-host" ref={embedRef} />
        {status !== "ready" && <div className={`video-card-placeholder ${status === "error" ? "is-error" : ""}`} aria-live="polite">
          <span className="video-card-play" aria-hidden="true">▶</span>
          <span>{status === "error" ? "This Reel is unavailable here." : "Instagram Reel"}</span>
          {status === "error" && <a href={reel.url} target="_blank" rel="noopener noreferrer">View on Instagram ↗</a>}
        </div>}
      </>}
    </div>
  </article>;
}

export function ShopByVideo({ reels = shopByVideoReels, gallery = false }: { reels?: ShopVideo[]; gallery?: boolean }) {
  const orderedReels = reels.filter((reel) => Boolean(reel.videoSrc)).sort((a, b) => a.displayOrder - b.displayOrder);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanPrevious(viewport.scrollLeft > 2);
    setCanNext(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 2);
  }, []);

  useEffect(() => {
    if (gallery) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [gallery, orderedReels.length, updateArrows]);

  function move(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cards = Array.from(viewport.querySelectorAll<HTMLElement>(".video-card"));
    if (!cards.length) return;
    const first = cards[0].offsetLeft;
    const positions = cards.map((card) => card.offsetLeft - first);
    const current = viewport.scrollLeft;
    const target = direction === 1
      ? positions.find((position) => position > current + 2) ?? positions[positions.length - 1]
      : [...positions].reverse().find((position) => position < current - 2) ?? positions[0];
    viewport.scrollTo({ left: target, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return <section className={`shop-by-video ${gallery ? "shop-by-video-gallery" : ""}`} aria-labelledby={gallery ? "video-gallery-title" : "shop-by-video-title"}>
    <div className="shop-by-video-header">
      {gallery ? <h1 id="video-gallery-title">SHOP BY VIDEO</h1> : <h2 id="shop-by-video-title">SHOP BY VIDEO</h2>}
      {gallery ? <Link className="shop-by-video-view-all" href="/">Back to shop <span aria-hidden="true">↗</span></Link>
        : orderedReels.length > 0 && <Link className="shop-by-video-view-all" href="/videos">View all <span aria-hidden="true">↗</span></Link>}
    </div>
    {orderedReels.length ? <div className={gallery ? "shop-by-video-gallery-layout" : "shop-by-video-carousel"}>
      <div className={gallery ? "shop-by-video-grid" : "shop-by-video-track"} ref={gallery ? undefined : viewportRef} onScroll={gallery ? undefined : updateArrows}>
        {orderedReels.map((reel) => <ShopVideoCard key={reel.id} reel={reel} />)}
      </div>
      {!gallery && orderedReels.length > 1 && <div className="shop-by-video-navigation" aria-label="Video carousel controls">
        <button type="button" onClick={() => move(-1)} disabled={!canPrevious} aria-label="Previous videos">←</button>
        <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label="Next videos">→</button>
      </div>}
    </div> : <p className="shop-by-video-empty">Coming soon.</p>}
    {!gallery && <div className="shop-by-video-follow-wrap">
      <a className="button shop-by-video-follow" href="https://www.instagram.com/pebblesboutique_ksa?psln=MW0wN24wMDg2bmtkOQ==" target="_blank" rel="noopener noreferrer">
        Follow Us
      </a>
    </div>}
  </section>;
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { googleOverallRating, googleReviews, type GoogleReview } from "../googleReviews";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="google-review-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "" : "is-empty"} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

function ReviewAvatar({ review }: { review: GoogleReview }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="google-review-avatar">
      {review.photo && !failed ? (
        <img src={review.photo} alt={review.name} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{review.name.trim().charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <article className="google-review-card">
      <div className="google-review-customer">
        <ReviewAvatar review={review} />
        <div>
          <h3>{review.name}</h3>
          {review.date && <span className="google-review-date">{review.date}</span>}
        </div>
      </div>
      <ReviewStars rating={review.rating} />
      <p>{review.review}</p>
    </article>
  );
}

export function GoogleReviews({ reviews = googleReviews }: { reviews?: GoogleReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(reviews.length > 3);
  const overallRating = googleOverallRating.toFixed(1);

  const updateNavigation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanGoBack(track.scrollLeft > 2);
    setCanGoForward(track.scrollLeft < track.scrollWidth - track.clientWidth - 2);
  }, []);

  useEffect(() => {
    updateNavigation();
    window.addEventListener("resize", updateNavigation);
    return () => window.removeEventListener("resize", updateNavigation);
  }, [reviews.length, updateNavigation]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>(".google-review-card");
    if (!track || !firstCard) return;
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    track.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior });
  };

  if (!reviews.length) return null;

  return (
    <section className="google-reviews section-pad" aria-labelledby="google-reviews-title">
      <div className="google-reviews-header">
        <div>
          <p className="eyebrow">From our customers</p>
          <h2 id="google-reviews-title">Words from <em>our community.</em></h2>
        </div>
        <div className="google-reviews-rating" aria-label={`Google rating: ${overallRating} out of 5 stars`}>
          <Image src="/images/google-logo.png" alt="Google" width={92} height={30} />
          <div><strong>{overallRating}</strong><ReviewStars rating={googleOverallRating} /></div>
        </div>
      </div>
      <div className="google-reviews-carousel">
        <div className="google-reviews-track" ref={trackRef} onScroll={updateNavigation} role="region" aria-roledescription="carousel" aria-label="Customer reviews" tabIndex={0}>
          {reviews.map((review) => <ReviewCard review={review} key={review.id} />)}
        </div>
      </div>
      <div className="google-reviews-navigation" aria-label="Review carousel controls">
        <button type="button" onClick={() => move(-1)} disabled={!canGoBack} aria-label="Previous review">←</button>
        <button type="button" onClick={() => move(1)} disabled={!canGoForward} aria-label="Next review">→</button>
      </div>
    </section>
  );
}

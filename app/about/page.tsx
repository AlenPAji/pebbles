import { PageIntro, SiteFooter, SiteHeader } from "../components/store";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="about-page">
        <PageIntro
          eyebrow="About Pebbles Boutique"
          title={<>Fashion. <em>Confidence. Elegance.</em></>}
          description="A curated destination for modern elegance, unique style, and the woman who wears it her own way."
        />
        <section className="about-section about-introduction">
          <div>
            <p className="eyebrow">Our story</p>
            <h2>Style with a <em>point of view.</em></h2>
          </div>
          <div className="about-copy">
            <p>Established in 2024, Pebbles Boutique began as a curated online destination dedicated to bringing modern elegance and unique style to women. Under the visionary leadership of Bincy, whose passion for fashion drives our brand, Pebbles Boutique was built to fulfill the style aspirations of women seeking premium quality and individuality.</p>
            <p>Driven by an unwavering commitment to our community, our journey quickly evolved from a digital presence and a modest boutique setup into the opening of our flagship store in Kulakkada in July 2026. Today, we seamlessly bridge digital convenience with personalized in-store service, offering a complete shopping experience for the modern woman.</p>
          </div>
        </section>
        <section className="about-section about-philosophy">
          <div>
            <p className="eyebrow">Our collection &amp; philosophy</p>
            <h2>Fashion is your <em>personal story.</em></h2>
          </div>
          <div className="about-copy">
            <p>At Pebbles Boutique, we believe that fashion is an expression of your personal story. Our diverse collection caters to both contemporary and traditional tastes, celebrating the uniqueness of every woman who wears our designs.</p>
            <p>We handpick and thoughtfully curate each piece, focusing on exceptional craftsmanship, comfortable fits, and trend-forward aesthetics. Every choice is made to elevate your individuality, help you stand out, and radiate confidence on every occasion.</p>
          </div>
        </section>
        <section className="about-values">
          <p className="eyebrow">Why shop with us?</p>
          <div className="about-value-grid">
            <article>
              <span>01</span>
              <h3>Curated versatility</h3>
              <p>A thoughtfully selected range spanning casual chic, traditional wear, and modern statement pieces.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Uncompromising quality</h3>
              <p>Every garment is chosen with strict attention to fabric quality, design detail, and lasting durability.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Omnichannel shopping</h3>
              <p>Enjoy the ease of shopping online from anywhere, or visit our flagship store in Kulakkada for a personalized styling experience.</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

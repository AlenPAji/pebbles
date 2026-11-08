import { SiteFooter, SiteHeader } from "../components/store";

const termsSections = [
  {
    title: "General Terms & Eligibility",
    items: [
      ["Age Requirement", "By using this Website or placing an order, you represent that you are at least 18 years of age or the legal age of majority in your jurisdiction."],
      ["Updates to Terms", "We reserve the right to update or modify these Terms at any time without prior notice. Continued use of the Website following any updates constitutes acceptance of the new Terms."],
      ["Language & Communication", "Official communications, customer support, and administrative documents may be provided in English or Malayalam."]
    ]
  },
  {
    title: "Products & Visual Representation",
    items: [
      ["Product Range", "Pebbles Boutique specializes in curated readymade women's apparel, including sarees, ethnic wear, fusion, and modern clothing collections."],
      ["Visual Representation", "Product images are for representation purposes only. Minor variations in color, texture, weave, and handcrafted details may occur due to photography lighting, screen settings, or the unique nature of fabrics."],
      ["Modifications", "We reserve the right to modify, discontinue, or limit quantities of any product or service without prior notice."]
    ]
  },
  {
    title: "Orders, Pricing & Payment Discrepancies",
    items: [
      ["Pricing & Currency", "All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless specified otherwise."],
      ["Accepted Payment Methods", "We accept major Credit/Debit Cards, UPI, Net Banking, and authorized digital wallets listed at checkout."],
      ["Pricing Errors & Cancellations", "We reserve the right to refuse or cancel orders arising from inaccurate pricing listings, stock unavailability, delivery restrictions, or suspected fraudulent activity."],
      ["Debited Amount Issues", "If money is debited from your account/card but your order is not confirmed on our website, please contact us immediately with your bank/transaction reference number. We will verify the status with our acquiring payment gateway to coordinate an order confirmation or refund in accordance with banking laws."]
    ]
  },
  {
    title: "Shipping, Delivery & Postal Dispatch Timelines",
    items: [
      ["Domestic Shipping (India)", "All standard domestic orders within India are shipped via postal courier services and are typically delivered within 4 to 5 working days from the date of dispatch."],
      ["International Shipping", "International orders shipped via postal services are typically delivered within 7 to 10 working days from dispatch."],
      ["Courier Transit & Delays", "While we make every effort to dispatch and deliver your orders on time, delivery timelines are estimates. Pebbles Boutique is not liable for unexpected delays caused by postal/courier logistics disruptions, customs clearance processes, or natural events beyond our control."],
      ["Risk of Loss", "Risk of loss and ownership of the products pass to you upon successful delivery by the postal/courier service."]
    ]
  },
  {
    title: "Returns, Exchanges & Refund Policy",
    intro: "All sales are governed by our exchange policy in compliance with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.",
    items: [
      ["Exchange Conditions", "Exchanges are accepted for items in their original condition—unworn, unused, unwashed, unaltered, undamaged, and with all original tags intact."],
      ["Timeframe", "Exchange requests must be submitted within 48 hours from the exact date and time of product delivery."],
      ["Unboxing Video Evidence (Recommended)", "Customers are strongly encouraged to record a continuous, unedited video while opening their parcel—clearly showing the sealed package, the unboxing process, and the product condition. An unboxing video speeds up the verification of damage, defect, or missing-item claims. Claims without a video will be evaluated on secondary evidence (photographs/packaging) and may take longer to process. Claims accompanied by videos must be submitted within 24 hours of delivery."],
      ["Refund Processing Time", "Where a refund is approved by management, funds will be credited back to the original payment method within 3 to 7 business days."],
      ["EMI Purchases", "For orders placed via Equated Monthly Installment (EMI), cancellations and refunds are processed strictly per the issuing bank's terms."]
    ]
  },
  {
    title: "Intellectual Property Rights",
    text: "All visual assets, designs, graphics, page layouts, product photography, logos, videos, and brand material displayed on this website are the exclusive intellectual property of Pebbles Boutique. Reproduction, copying, distribution, or unauthorized commercial exploitation of any content without prior written permission is strictly prohibited."
  },
  {
    title: "Prohibited Activities & Site Management",
    intro: "You agree not to engage in any of the following prohibited activities:",
    bullets: [
      "Engaging in unlawful, deceptive, or fraudulent practices.",
      "Attempting to hack, compromise, or disrupt the website's security or server performance.",
      "Using automated tools (bots, scrapers, crawlers) without explicit authorization.",
      "Distributing viruses, malware, or harmful code.",
      "Misusing or abusing return/refund policies for fraudulent personal gain."
    ],
    text: "We reserve the right to monitor site activity, restrict access, or terminate accounts immediately if suspicious or prohibited conduct is detected."
  },
  {
    title: "Limitation of Liability & Warranty Disclaimer",
    items: [
      ["Warranty Disclaimer", "All products are provided as described on the website, subject to statutory consumer rights. Except as required by law, no additional express or implied warranties are provided. We do not guarantee that the website will operate completely error-free or without temporary downtime."],
      ["Limitation of Liability", "Pebbles Boutique shall not be held liable for indirect, incidental, special, or consequential damages. Our total liability for any claim shall not exceed the actual amount paid by you for the specific order in dispute."]
    ]
  },
  {
    title: "Indemnification",
    text: "You agree to indemnify, defend, and hold harmless Pebbles Boutique, its management, employees, and affiliates from any claims, damages, liabilities, losses, or legal expenses arising out of your violation of these Terms or misuse of the website."
  },
  {
    title: "Governing Law & Jurisdiction",
    text: "These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims shall be subject to the exclusive jurisdiction of the courts in Kerala, India."
  }
];

export default function TermsAndConditionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <header className="page-intro">
          <p className="eyebrow">Pebbles Boutique</p>
          <h1>Terms &amp; <em>Conditions.</em></h1>
          <p>Last updated on November 6, 2026</p>
        </header>
        <div className="legal-content">
          <p className="legal-lead">Welcome to Pebbles Boutique (the &quot;Website&quot;). These Terms &amp; Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you and Pebbles Boutique, operating from our flagship store and operational base located in Kulakkada, Kerala, India.</p>
          <p>By accessing our website, purchasing our products, or visiting our physical store, you agree to be bound by these Terms. If you do not agree, please discontinue using the Website immediately.</p>
          {termsSections.map((section, index) => (
            <section className="legal-section" key={section.title}>
              <h2><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
              {section.intro && <p>{section.intro}</p>}
              {section.items && <ul>{section.items.map(([label, text]) => <li key={label}><strong>{label}:</strong> {text}</li>)}</ul>}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {section.text && <p>{section.text}</p>}
            </section>
          ))}
          <section className="legal-section legal-contact">
            <h2><span>11</span>Contact Information</h2>
            <p>For any inquiries, order assistance, or policy clarifications, please contact our support team:</p>
            <ul>
              <li><strong>Brand Name:</strong> Pebbles Boutique</li>
              <li><strong>Store Address:</strong> Kulakkada, Kerala, India</li>
              <li><strong>Email:</strong> <a href="mailto:info@pebblesboutique.in">info@pebblesboutique.in</a></li>
              <li><strong>Phone:</strong> [Insert Phone Number]</li>
              <li><strong>Website:</strong> <a href="https://pebblesboutique.in">https://pebblesboutique.in</a></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

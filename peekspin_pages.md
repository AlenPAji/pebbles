# PEEKSPIN — Website Pages

Single-vendor e-commerce platform. The website has a customer storefront and a vendor/admin dashboard. No marketplace or multi-vendor pages are required.

## 1. Customer Pages

| # | Page | Suggested Route | What it contains |
|---|---|---|---|
| 1 | Home | `/` | Store banner and featured products. |
| 2 | Products | `/products` | Product listing, name search and category filters. |
| 3 | Product Details | `/products/[slug]` | Product photos, description, price and Add to Cart. |
| 4 | Cart | `/cart` | Selected items; change quantities or remove items. |
| 5 | Checkout | `/checkout` | Delivery address, payment option and place order. |
| 6 | Login | `/login` | Sign in to customer account. |
| 7 | Register | `/register` | Create customer account. |
| 8 | My Orders | `/orders` | Order history and current order statuses. |
| 9 | Order Details | `/orders/[id]` | Individual order details, courier name, tracking ID and optional tracking link. |
| 10 | Profile | `/profile` | View and manage customer profile. |
| 11 | Contact Us | `/contact` | Store contact information. |

## 2. Vendor / Admin Pages

| # | Page | Suggested Route | What it contains |
|---|---|---|---|
| 1 | Admin Login | `/admin/login` | Admin sign-in. |
| 2 | Dashboard | `/admin` | Basic overview of orders, sales and products. |
| 3 | Products | `/admin/products` | Product list with edit/delete actions. |
| 4 | Add Product | `/admin/products/new` | Create product and upload images. |
| 5 | Edit Product | `/admin/products/[id]/edit` | Update product information and images. |
| 6 | Categories | `/admin/categories` | Create, edit and delete categories. |
| 7 | Orders | `/admin/orders` | All orders and payment statuses. |
| 8 | Order Details | `/admin/orders/[id]` | Customer delivery details; manually update order status and shipment details. |
| 9 | Customers | `/admin/customers` | Customer list and associated order details. |

### Manual shipment tracking (inside Admin Order Details)

The vendor can set an order to **Pending, Processing, Shipped, Delivered or Cancelled** and enter/edit:

- Courier name
- Tracking ID
- Optional courier tracking URL
- Dispatch date

The customer sees the vendor-provided status and shipment information in **My Orders / Order Details**. The tracking URL, when provided, opens the courier website. No separate shipment page, courier API, live tracking or automatic status synchronization is required.

## 3. Page Count

- Customer: **11 pages**
- Vendor/Admin: **9 pages**
- **Total: 20 pages**

> Routes and the split between list/detail, login/register, and add/edit screens are suggested implementation choices. The functional scope follows the supplied PEEKSPIN requirements. Store settings and inventory management are excluded.

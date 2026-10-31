# MNMT Shopify theme

Custom Online Store 2.0 theme for mnmt.co, a trade-only showroom for handmade tile,
natural stone, artisan plaster and microcement.

## What it does

- **Trade-gated pricing.** Prices and the add-to-order button show only to logged-in
  customers on a B2B company or tagged with the trade tag (default `trade-approved`,
  set in Theme settings > Trade program). Everyone else sees a log in / apply message.
- **Coverage calculator.** On product pages, trade buyers enter square footage and
  the theme rounds up to whole boxes with overage (default 10%).
- **Special order and quote-only products** via product metafields.
- **Trade application and quote request** pages built on the Shopify contact form.

## Metafields

Create these definitions in Settings > Custom data. Namespace is `mnmt`.

| Owner | Key | Type | Used for |
| --- | --- | --- | --- |
| Product | `special_order` | True or false | "Special order" badge and lead-time notice |
| Product | `quote_only` | True or false | Replaces add-to-order with Request a quote |
| Product | `lead_time` | Single line text | e.g. "16 to 20 weeks" |
| Product | `finish` | Single line text | Spec table |
| Product | `thickness` | Single line text | Spec table |
| Product | `application` | Single line text | e.g. "Walls, floors, showers" |
| Product | `wet_area_rated` | True or false | Spec table |
| Product | `origin` | Single line text | Spec table |
| Product | `spec_sheet` | File | Download link |
| Variant | `sqft_per_box` | Decimal | Coverage calculator and spec table |
| Variant | `pieces_per_box` | Integer | Spec table |
| Variant | `sell_unit` | Single line text | Price suffix, e.g. "box", "sq ft", "bucket" |

## Pages to create in the admin

- **Trade program**: assign template `page.trade`, then pick it in Theme settings > Trade program.
- **Request a quote**: assign template `page.quote`, then pick it in Theme settings > Trade program.

## Development

```
npm install -g @shopify/cli@3
shopify theme check
shopify theme dev --store mnmt-co   # preview against the live store data
shopify theme push --unpublished     # upload as a new, unpublished theme
```

The live theme is not replaced until it is published from the Shopify admin.

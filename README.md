# America Home Buyers Website

Static SEO and lead-conversion website for America Home Buyers LLC.

## Local Preview

The site can be previewed with:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

## Before Publishing

- Submit a test lead through the embedded HubSpot form and confirm the contact, property details, notification, and workflow appear correctly in portal `44205664`.
- Add a verified public business address to the site and `LocalBusiness` schema if customers can visit that location. Do not publish a private home address.
- Add real, approved customer reviews when available. The current seller-stories page is intentionally excluded from search results until then.
- Have a qualified North Carolina attorney review `privacy.html`, `terms.html`, purchase-contract disclosures, and any automated text-message consent before launch.
- Connect Google Search Console, Bing Webmaster Tools, analytics, and call tracking before paid promotion.
- Configure HubSpot to redirect successful submissions to `https://americahomebuyersnc.com/thank-you.html` as a backup to the site event listener.

## Production Build

Run:

```bash
sh build.sh
```

Deploy the generated `dist/` folder. The build intentionally excludes raw `.DNG`, `.HEIC`, `.MOV`, and original camera files.

Recommended Cloudflare Pages settings:

- Build command: `sh build.sh`
- Build output directory: `dist`
- Framework preset: `None`
- Production branch: your main branch

## Image Assets Added

Clean web copies of selected AHB property photos are in `assets/images/`.
These are the files used by the site:

- `local-house-clean.jpg`
- `boarded-house-clean.jpg`
- `repair-interior-clean.jpg`
- `cluttered-room-clean.jpg`
- `exterior-project-clean.jpg`
- `cleanup-debris-clean.jpg`
- `porch-walkthrough-clean.jpg`
- `brand-hard-work-clean.jpg`
- `brand-walk-logo-clean.jpg`
- `we-buy-houses-sign-clean.jpg`
- `bathroom-hard-work-clean.jpg`
- `project-house-yard-clean.jpg`

The clean files were rendered from the source photos and checked so the public site copies do not expose camera/date/location metadata in the normal image metadata output.

Do not publish raw uploads such as `.DNG`, `.HEIC`, `.MOV`, or original camera `.JPG` files unless they are intentionally cleaned, resized, and reviewed first. The live site should use the `*-clean.jpg` web copies.

## Conversion Elements Included

- HubSpot lead form embedded on the homepage and contact page.
- Call-first CTAs using `(336) 701-2230`.
- Mobile sticky action bar across the site.
- Reassurance copy near forms: no spam, no obligation, call or text is fine.
- Direct comparison copy explaining traditional listing vs. as-is direct sale.
- Real brand/sign imagery from the provided America Home Buyers assets.

## SEO Files Included

- `sitemap.xml`
- `robots.txt`
- `llms.txt`
- Homepage `LocalBusiness` schema
- FAQ schema on the Winston-Salem page
- Dedicated Thomasville and Lexington landing pages

## First Pages Built

- Homepage
- About
- How It Works
- Areas Served
- Reviews
- Contact
- Sell My House Fast Winston-Salem NC
- We Buy Houses Greensboro NC
- Cash Home Buyers High Point NC
- We Buy Houses Thomasville NC
- Sell My House Fast Lexington NC
- Sell an Inherited House in NC
- Sell a House That Needs Repairs in NC
- Sell a Rental Property With Tenants in NC

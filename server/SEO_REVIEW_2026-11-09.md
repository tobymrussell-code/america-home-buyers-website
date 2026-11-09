# SEO/AEO implementation — November 9, 2026

Published changes: complete LocalBusiness identity on homepage and About (consistent address, phone/email, founder, logo, existing GBP/Facebook profiles and Census-geocoded coordinates); FAQ markup generated from visible FAQ answers; Article/BlogPosting attribution, publisher and dates across 15 guides/posts; Service and BreadcrumbList coverage on 22 city/situation/guide pages; direct-answer treatment on guides; distinct seller-review guidance on all 11 city/county pages; city/situation cross-links and seller-resource footer navigation; missing Open Graph/Twitter tags; explicit crawler permissions; updated sitemap; intrinsic image dimensions.

Dates: existing blog publication dates retained. Where no publication date existed, the earliest source commit date is used as the best available first-publication proxy; revision dates reflect this content/schema update. Coordinates use the Census address-range match for 3687 Old US Hwy 29, Thomasville, NC 27360 (35.873912146075, -80.142669112242), not a survey. No invented business hours, price ranges, reviews or market statistics.

Checks: production build and six lead-validation tests pass. `python tests/seo-audit.py` checks 38 indexable pages, valid JSON-LD, exact visible FAQ alignment, unique titles/descriptions, canonical domain, internal resource existence, sitemap coverage and form-script retention. All eight static external destinations returned HTTP 200. Form code, server route and attribution code were not edited.

Google live Rich Results Test passed five representative URLs:
- Homepage: https://search.google.com/test/rich-results/result?id=huKOpKsz-uVGHalEGO7GDg (2 valid items)
- About: https://search.google.com/test/rich-results/result?id=3fjFbNHbMnDw2UbXSYBIXg (2 valid items)
- Thomasville: https://search.google.com/test/rich-results/result?id=jmGeUq-BBcdsHoubcBlLCQ (1 valid item)
- Repairs: https://search.google.com/test/rich-results/result?id=YerKIk49yO-k-CTN4FJDvg (2 valid items)
- Blog: https://search.google.com/test/rich-results/result?id=rPdTYVDSrwBDitU5G4m3ng (1 valid item)

LocalBusiness has an optional priceRange recommendation; left unset because property purchase prices vary. Google does not report every Schema.org type as a supported rich result. FAQ rich results are generally restricted to government/health sites. Schema does not guarantee rankings or AI citations.

Not completed/verified: Google testing of every individual URL, Search Console sitemap submission/index inspection, field Core Web Vitals and physical-device form testing in this pass. Public PageSpeed API rejected the request due to its shared daily quota. Ahrefs Site Audit rejected access with Insufficient plan. Broader neighborhood/corridor reporting and current local market statistics require researched source material; new city sections focus on distinct seller-review considerations rather than invented hyperlocal claims. No significant-duplicate-content certification is claimed; shared navigation, forms and repeated educational boilerplate remain.

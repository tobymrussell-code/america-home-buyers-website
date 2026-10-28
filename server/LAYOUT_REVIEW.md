# Lead capture layout review — 2026-10-28

Implemented: smaller top-aligned homepage headline and header; required phone/property fields first; optional name/email/ZIP grouped in a native disclosure; address lookup visually secondary; full-width 52px submit button; 16px form controls; direct local form CTAs instead of homepage detours; mobile navigation with outside-click/Escape dismissal; mobile offer action ahead of long introductory copy; reduced-motion and safe-area support; contact photo contained above footer; contact telephone/email links actionable.

Verified in the production browser: desktop homepage, responsive iframe viewports 390px homepage, 320px contact and 768px Thomasville. No horizontal document overflow at these widths. Menu opens and Escape closes it; mobile Get Offer navigates to the local form without leaving the page. Contact image ends above the footer. This is responsive browser verification, not physical handset/keyboard testing.

A collapsed optional email field containing invalid text reopens with a visible validation error. A corrected labeled QA submission completed through Turnstile and the server, redirected to thank-you, and appeared on HubSpot contact 258568167260 as DO NOT CONTACT - layout verification (16 conversion events after this test). Existing server validation tests and production build pass.

Titles, meta descriptions, canonical URLs, H1 text and JSON-LD remain unchanged. All existing 13 form pages retain the same protected server route and attribution logic. These changes reduce observed usability friction; conversion lift requires subsequent traffic data and is not yet measured.

# Seller form intake

Production Worker: `ahb-lead-intake`, custom domain `forms.americahomebuyersnc.com`. The main site remains on GitHub Pages.

The Worker bundles `lead-validation.js` followed by `lead-worker.js` (remove the shared import and named export keywords, retain the default Worker export). It uses compatibility date 2026-10-28. The Turnstile secret is a Cloudflare secret binding; never put it in source control. The public sitekey lives in `lead-forms.js`.

Required bindings: TURNSTILE_SECRET (secret_text), INTAKE_LIMIT (ratelimit, namespace 2026102801, limit 60 per 60 seconds). Widget mode invisible, allowed apex/www hostnames, action seller_lead. Siteverify checks success, action and hostname. Do not substitute Cloudflare testing secrets in production. No personal details or request bodies are logged.

POST /submit and POST /address accept JSON with exact apex/www CORS origins. /submit checks the payload, honeypot and Turnstile before forwarding to existing HubSpot form 8e3f6d0d-8f94-41b2-b739-9a7722c56475 in portal 44205664. GET /health reports readiness without exposing the secret. Address lookup uses U.S. Census geocoding; no match never blocks manual entry. Phone validation checks numbering-plan plausibility and placeholders, not ownership.

Campaign parameters and click IDs are retained in session storage across site navigation, then forwarded in HubSpot context.pageUri with the HubSpot visitor cookie when available. Existing advertising consent handling remains in script.js. Conversion events fire only after HubSpot accepts the submission.

Verification: node --test tests/lead-validation.test.mjs; sh build.sh. On 2026-10-28, all 13 production form pages completed real protected submissions with the business phone and a contact clearly named Website QA / DO NOT CONTACT. HubSpot contact 258568167260 records the test conversions and campaign source website_qa, medium internal, campaign form_validation. Phone-only submissions are recorded as HubSpot form submissions; HubSpot may not create a contact without email, matching the previously optional-email form. Existing public HubSpot form submission URLs remain a separate provider endpoint; website validation does not secure direct requests made to that provider.

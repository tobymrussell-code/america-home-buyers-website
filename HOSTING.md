# Recommended Hosting: Cloudflare Pages

Cloudflare Pages is the best fit for this site because the website is static and HubSpot handles the lead form.

## Expected Cost

- Website hosting: free for the current site
- SSL certificate: included
- CDN and compression: included
- Custom domain connection: included
- Domain registration: paid separately if the domain is not already owned

## Launch Steps

1. Run `sh build.sh`.
2. Sign in to Cloudflare.
3. Open **Workers & Pages**.
4. Create a Pages project.
5. Choose **Direct Upload** for the quickest first launch.
6. Upload the contents of the `dist` folder.
7. Add `americahomebuyersnc.com` as the custom domain.
8. Follow Cloudflare's DNS prompts.
9. Confirm both `https://americahomebuyersnc.com` and the `www` version resolve to the preferred domain.
10. Submit a real test lead and confirm it appears in HubSpot.

## Recommended Account Setup

- Turn on Cloudflare Web Analytics.
- Connect Google Search Console after the domain is live.
- Connect Bing Webmaster Tools.
- Submit `https://americahomebuyersnc.com/sitemap.xml`.
- Configure HubSpot to redirect successful forms to `https://americahomebuyersnc.com/thank-you.html`.
- Add GA4 or Google Tag Manager only after the measurement ID is available and the privacy policy is updated if necessary.

## Ongoing Deployment

For automatic deployments, place the project in a GitHub repository and connect that repository to Cloudflare Pages.

Use:

- Build command: `sh build.sh`
- Output directory: `dist`
- Framework preset: `None`

Cloudflare will rebuild the site after approved changes are pushed to the production branch.

## Do Not Upload the Workspace Root

The workspace contains original camera files. Upload only `dist`. The production build excludes `.DNG`, `.HEIC`, `.MOV`, original camera files, and other material that should not be public.

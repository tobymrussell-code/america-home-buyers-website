const GA_MEASUREMENT_ID = "G-D2XN9YZ5W4";
const OPENAI_ADS_PIXEL_ID = "9FmnXnbvudRMeeiYaAJCt1";
const HUBSPOT_OFFER_FORM_ID = "8e3f6d0d-8f94-41b2-b739-9a7722c56475";

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag() {
  window.dataLayer.push(arguments);
};

window.gtag("js", new Date());
window.gtag("config", GA_MEASUREMENT_ID, {
  send_page_view: true
});

const analyticsScript = document.createElement("script");
analyticsScript.async = true;
analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
document.head.appendChild(analyticsScript);

function trackEvent(eventName, parameters = {}) {
  try {
    window.gtag("event", eventName, parameters);
  } catch (_) {
    // Measurement must never interrupt a contact request.
  }
}

let adsMeasurementAllowed = false;
let adsPixelInitialized = false;
let adsPageViewSent = false;

function callAdsPixel(...args) {
  try {
    if (typeof window.oaiq === "function") window.oaiq(...args);
  } catch (_) {
    // A blocked or unavailable pixel must not affect the form.
  }
}

// Follow the existing HubSpot banner, including category-specific denials.
// Wait for its policy decision; do not infer consent from visiting the site.
window._hsp = window._hsp || [];
window._hsp.push(["addPrivacyConsentListener", (consent) => {
  const hasAdsConsent = typeof consent?.categories?.advertisement === "boolean"
    ? consent.categories.advertisement
    : consent?.allowed === true;
  adsMeasurementAllowed = hasAdsConsent && navigator.globalPrivacyControl !== true;

  if (!adsMeasurementAllowed) {
    callAdsPixel("consent", false);
    return;
  }

  try {
    if (!adsPixelInitialized) {
      if (!window.oaiq) {
        const queue = function () { queue.q.push(arguments); };
        queue.q = [];
        window.oaiq = queue;
        const pixelScript = document.createElement("script");
        pixelScript.async = true;
        pixelScript.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
        document.head.appendChild(pixelScript);
      }
      callAdsPixel("consent", true);
      callAdsPixel("init", { pixelId: OPENAI_ADS_PIXEL_ID });
      adsPixelInitialized = true;
    } else {
      callAdsPixel("consent", true);
    }
    if (!adsPageViewSent) {
      callAdsPixel("measure", "page_viewed", {
        type: "contents",
        contents: [{ id: window.location.pathname, content_type: "page" }]
      }, { opt_out: true });
      adsPageViewSent = true;
    }
  } catch (_) {
    // Loading measurement is optional; the business flow continues.
  }
}]);

async function matchingUser(form) {
  if (!form?.getFieldValue || !window.crypto?.subtle) return null;
  const [email, phone] = await Promise.all([
    form.getFieldValue("0-1/email"),
    form.getFieldValue("0-1/phone")
  ]);
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string"
    ? phone.replace(/[\s().-]/g, "").replace(/^\+/, "").replace(/^0+/, "") : "";
  const user = {};
  async function hash(value) {
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }
  if (normalizedEmail) user.email_sha256 = await hash(normalizedEmail);
  if (/^\d{8,15}$/.test(normalizedPhone)) user.phone_number_sha256 = await hash(normalizedPhone);
  return Object.keys(user).length ? user : null;
}

async function measureConfirmedLead(form, eventId) {
  if (!adsMeasurementAllowed) return;
  let timeout;
  try {
    // Matching is optional and bounded so it cannot hold up the redirect.
    const user = await Promise.race([
      matchingUser(form).catch(() => null),
      new Promise(resolve => { timeout = window.setTimeout(() => resolve(null), 250); })
    ]);
    if (!adsMeasurementAllowed) return;
    if (user) callAdsPixel("init", { user });
    callAdsPixel("measure", "lead_created", { type: "customer_action" }, {
      event_id: eventId,
      opt_out: true
    });
  } catch (_) {
    // Ignore measurement failures after a successful submission.
  } finally {
    window.clearTimeout(timeout);
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  if (link.href.startsWith("tel:")) {
    trackEvent("ahb_phone_click", {
      link_url: link.href,
      page_path: window.location.pathname,
      contact_method: "phone"
    });
  }

  if (
    link.getAttribute("href")?.includes("#offer-form") ||
    link.getAttribute("href")?.includes("#local-form")
  ) {
    trackEvent("ahb_offer_cta_click", {
      link_text: link.textContent.trim(),
      page_path: window.location.pathname
    });
  }

  if (link.href.startsWith("mailto:")) {
    trackEvent("ahb_email_click", {
      link_url: link.href,
      page_path: window.location.pathname
    });
  }
});

trackEvent("ahb_page_ready", {
  page_path: window.location.pathname,
  page_title: document.title
});

if (window.location.pathname.endsWith("/thank-you.html")) {
  trackEvent("ahb_thank_you_view", {
    page_path: window.location.pathname
  });
}

const measuredSubmissions = new Set();
window.addEventListener("hs-form-event:on-submission:success", (event) => {
  if (event.detail?.formId !== HUBSPOT_OFFER_FORM_ID) return;

  let form;
  let conversionId;
  try {
    form = window.HubSpotFormsV4?.getFormFromEvent(event);
    conversionId = form?.getConversionId();
  } catch (_) {
    // The documented success event is sufficient even if matching is unavailable.
  }
  const eventId = conversionId || event.detail.instanceId;
  if (!eventId || measuredSubmissions.has(eventId)) return;
  measuredSubmissions.add(eventId);

  const leadParameters = {
    hubspot_form_id: HUBSPOT_OFFER_FORM_ID,
    page_path: window.location.pathname,
    method: "hubspot_form"
  };
  trackEvent("ahb_lead_submitted", leadParameters);
  trackEvent("generate_lead", leadParameters);
  void measureConfirmedLead(form, eventId);

  window.setTimeout(() => {
    window.location.assign("/thank-you.html");
  }, 700);
});

// Only emitted after the validation server confirms HubSpot accepted the submission.
window.addEventListener('ahb:lead-confirmed', (event) => {
  const { submissionId, email, phone } = event.detail || {};
  if (!submissionId || measuredSubmissions.has(submissionId)) return;
  measuredSubmissions.add(submissionId);
  const parameters = {hubspot_form_id: HUBSPOT_OFFER_FORM_ID, page_path: location.pathname, method: 'validated_form'};
  trackEvent('ahb_lead_submitted', parameters);
  trackEvent('generate_lead', parameters);
  const adapter = {getFieldValue: async name => name === '0-1/email' ? email : '+1' + phone};
  void measureConfirmedLead(adapter, submissionId);
});

// Keep campaign attribution when a visitor moves from an informational page to a form.
(() => {
  const keys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','gbraid','wbraid','msclkid','fbclid','ttclid','oppref'];
  const query=new URLSearchParams(location.search);
  const incoming=Object.fromEntries(keys.filter(k=>query.get(k)).map(k=>[k,query.get(k).slice(0,250)]));
  if(!Object.keys(incoming).length)return;
  try {const saved=JSON.parse(sessionStorage.getItem('ahb-attribution')||'{}');sessionStorage.setItem('ahb-attribution',JSON.stringify({...saved,...incoming}));} catch {}
})();

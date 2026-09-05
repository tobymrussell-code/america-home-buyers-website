const GA_MEASUREMENT_ID = "G-D2XN9YZ5W4";

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
  window.gtag("event", eventName, parameters);
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

window.addEventListener("message", (event) => {
  if (
    event.data?.type === "hsFormCallback" &&
    event.data?.eventName === "onFormSubmitted" &&
    event.data?.id === "8e3f6d0d-8f94-41b2-b739-9a7722c56475"
  ) {
    const leadParameters = {
      hubspot_form_id: event.data.id,
      page_path: window.location.pathname,
      method: "hubspot_form"
    };

    trackEvent("ahb_lead_submitted", leadParameters);
    trackEvent("generate_lead", leadParameters);

    window.setTimeout(() => {
      window.location.assign("/thank-you.html");
    }, 700);
  }
});

window.dataLayer = window.dataLayer || [];

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  if (link.href.startsWith("tel:")) {
    window.dataLayer.push({
      event: "ahb_phone_click",
      link_url: link.href,
      page_path: window.location.pathname
    });
  }

  if (
    link.getAttribute("href")?.includes("#offer-form") ||
    link.getAttribute("href")?.includes("#local-form")
  ) {
    window.dataLayer.push({
      event: "ahb_offer_cta_click",
      link_text: link.textContent.trim(),
      page_path: window.location.pathname
    });
  }

  if (link.href.startsWith("mailto:")) {
    window.dataLayer.push({
      event: "ahb_email_click",
      link_url: link.href,
      page_path: window.location.pathname
    });
  }
});

window.dataLayer.push({
  event: "ahb_page_ready",
  page_path: window.location.pathname,
  page_title: document.title
});

window.addEventListener("message", (event) => {
  if (
    event.data?.type === "hsFormCallback" &&
    event.data?.eventName === "onFormSubmitted" &&
    event.data?.id === "8e3f6d0d-8f94-41b2-b739-9a7722c56475"
  ) {
    window.dataLayer.push({
      event: "ahb_lead_submitted",
      hubspot_form_id: event.data.id,
      page_path: window.location.pathname
    });

    window.setTimeout(() => {
      window.location.assign("/thank-you.html");
    }, 700);
  }
});

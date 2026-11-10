// Load only the chat UI on demand; the HubSpot analytics/consent loader is unchanged.
(() => {
  if (!document.getElementById('hs-script-loader')) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'ahb-chat-launcher'; button.textContent = 'Chat';
  button.setAttribute('aria-label', 'Open chat with America Home Buyers');
  document.body.append(button);
  let ready = false, requested = false, timeout;
  function load() {
    const api = window.HubSpotConversations;
    if (!ready || !api) return;
    if (api.widget.status().loaded) { api.widget.open(); button.hidden = true; }
    else api.widget.load({widgetOpen: true});
  }
  function onReady() {
    ready = true;
    window.HubSpotConversations.on('widgetLoaded', () => {
      clearTimeout(timeout); button.hidden = true;
      if (requested) window.HubSpotConversations.widget.open();
    });
    if (requested) load();
    else {
      try { if (sessionStorage.getItem('ahb-chat-used') === '1') window.HubSpotConversations.widget.load(); } catch {}
    }
  }
  button.addEventListener('click', () => {
    requested = true; button.disabled = true; button.textContent = 'Opening…';
    try { sessionStorage.setItem('ahb-chat-used', '1'); load(); } catch { ready = false; }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (button.hidden) return;
      button.disabled = false; button.textContent = 'Retry chat';
      button.setAttribute('aria-label', 'Retry chat, or call 336 701 2230');
    }, 12000);
  });
  if (window.HubSpotConversations) onReady();
  else { window.hsConversationsOnReady = window.hsConversationsOnReady || []; window.hsConversationsOnReady.push(onReady); }
})();

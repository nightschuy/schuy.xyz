(function () {
  var CONSENT_KEY = 'schuy_cookie_consent';
  // Keep in sync with the GA4 ID in index.html when you replace the placeholder.
  var GA_ID = 'G-Q9CDY0HD33';

  function initGA() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function showBanner() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.removeAttribute('hidden');

    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      banner.setAttribute('hidden', '');
      initGA();
    });

    document.getElementById('cookie-decline').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'declined');
      banner.setAttribute('hidden', '');
    });
  }

  function init() {
    var stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted') {
      initGA();
    } else if (!stored) {
      showBanner();
    }
    // 'declined' → no banner, no GA
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

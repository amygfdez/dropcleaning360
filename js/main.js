/* ============================================================
   Drop Cleaning 360 — site scripts
   ============================================================ */

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}
// Mobile dropdown
document.querySelectorAll('.dropdown > a').forEach(link => {
  link.addEventListener('click', (e) => {
    if (window.innerWidth <= 680) {
      e.preventDefault();
      link.parentElement.classList.toggle('open');
    }
  });
});

// Stock-photo fallback: if an external image fails, keep the gradient bg
document.querySelectorAll('img[data-fallback]').forEach(img => {
  img.addEventListener('error', () => { img.style.display = 'none'; });
});

/* ============================================================
   QUOTE FORM — EmailJS (sends 2 emails)
   ------------------------------------------------------------
   SETUP (one time, ~10 minutes):
   1. Create a free account at https://www.emailjs.com
   2. Add an "Email Service" connected to contact@primecleaning360.com
      (use "Custom SMTP" with GoDaddy/Microsoft 365 settings, or Gmail).
   3. Create TWO templates:
      a) "quote_owner"  — the email YOU receive. Use variables:
         {{from_name}} {{from_email}} {{phone}} {{service}} {{frequency}}
         {{message}} {{biz_type}} {{biz_sqft}} {{biz_freq}} {{biz_hours}}
      b) "quote_client" — the auto-reply the CLIENT receives.
         Set the template's "To email" field to {{from_email}}.
   4. Copy your PUBLIC KEY, SERVICE ID and the two TEMPLATE IDs below.
   ============================================================ */
const EMAILJS_PUBLIC_KEY   = '8Jekgg3CIL-j8w_qz';
const EMAILJS_SERVICE_ID   = 'service_4enlsvb';
const EMAILJS_TPL_OWNER    = 'template_yjcd9bk';
const EMAILJS_TPL_CLIENT   = 'template_83ud61d';

const quoteForm = document.getElementById('quoteForm');
if (quoteForm) {
  // Show/hide the optional commercial questions
  const serviceSel = document.getElementById('service');
  const commercialBox = document.getElementById('commercialExtra');
  serviceSel.addEventListener('change', () => {
    commercialBox.classList.toggle('show', serviceSel.value === 'Commercial Cleaning');
  });

  // Pre-select service from URL, e.g. quote.html?service=commercial
  const params = new URLSearchParams(window.location.search);
  const pre = (params.get('service') || '').toLowerCase();
  const map = {
    residential: 'Residential Cleaning (Standard)',
    deep: 'Deep Cleaning',
    move: 'Move-In / Move-Out Cleaning',
    commercial: 'Commercial Cleaning',
    postconstruction: 'Post-Construction Cleaning',
    airbnb: 'Airbnb / Short-Term Rental',
    recurring: 'Recurring Cleaning (Weekly / Bi-Weekly / Monthly)'
  };
  if (map[pre]) {
    serviceSel.value = map[pre];
    serviceSel.dispatchEvent(new Event('change'));
  }

  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    const btn = quoteForm.querySelector('button[type=submit]');
    status.className = 'form-status';

    const data = Object.fromEntries(new FormData(quoteForm).entries());

    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      status.textContent = 'The form is not connected yet. Please contact us on WhatsApp at (305) 998-9980 or email contact@primecleaning360.com.';
      status.classList.add('err');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      // 1) Email to the business
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TPL_OWNER, data);
      // 2) Auto-reply to the client
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TPL_CLIENT, data);
      status.textContent = 'Thank you! Your quote request has been received. We will get back to you shortly. 💧';
      status.classList.add('ok');
      quoteForm.reset();
      commercialBox.classList.remove('show');
    } catch (err) {
      status.textContent = 'Something went wrong sending your request. Please try again, or message us on WhatsApp at (305) 998-9980.';
      status.classList.add('err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Request My Free Quote';
    }
  });
}

/* ============================================================
   INSTAGRAM FEED — powered by Behold (free)
   ------------------------------------------------------------
   SETUP (~5 minutes):
   1. Go to https://behold.so and sign up free.
   2. Click "Add a source" and log in with the @dropcleaning360
      Instagram account to authorize it.
   3. Create a feed -> choose "API / JSON" as the type.
   4. Copy the feed URL (looks like https://feeds.behold.so/AbCdEf123)
      and paste it between the quotes below.
   Until then, the section shows the placeholder photos.
   ============================================================ */
const BEHOLD_FEED_URL = 'https://feeds.behold.so/P9O6hSTWNcgm8moB2jjI';

const igGrid = document.getElementById('igGrid');
if (igGrid && BEHOLD_FEED_URL) {
  fetch(BEHOLD_FEED_URL)
    .then(r => r.json())
    .then(data => {
      const bright = p => {
        const d = p.colorPalette && p.colorPalette.dominant;
        if (!d) return 1; // unknown: treat as fine
        const [r,g,b] = d.split(',').map(Number);
        return (0.299*r + 0.587*g + 0.114*b) > 40 ? 1 : 0; // 0 = near-black cover
      };
      const all = (Array.isArray(data) ? data : (data.posts || data.media || []))
        .filter(p => p && (p.sizes || p.mediaUrl || p.thumbnailUrl));
      // Prefer bright covers, keep newest-first order within each group
      const posts = [...all.filter(p => bright(p)), ...all.filter(p => !bright(p))].slice(0, 4);
      if (!posts.length) return; // keep placeholders
      igGrid.innerHTML = '';
      posts.forEach(p => {
        const url = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) ? p.sizes.medium.mediaUrl : ((p.mediaType === 'VIDEO' && p.thumbnailUrl) ? p.thumbnailUrl : (p.mediaUrl || p.thumbnailUrl));
        const a = document.createElement('a');
        a.href = p.permalink || 'https://www.instagram.com/dropcleaning360';
        a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('aria-label', 'View this post on Instagram');
        const img = document.createElement('img');
        img.src = url;
        img.alt = (p.caption || 'Drop Cleaning 360 Instagram post').slice(0, 100);
        img.loading = 'lazy';
        a.appendChild(img);
        igGrid.appendChild(a);
      });
    })
    .catch(() => { /* feed unavailable: placeholders stay */ });
}

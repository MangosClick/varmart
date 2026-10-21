// Customer reviews, copied as written from Google Maps and Justdial (checked 2026-10-21).
// Every .js-reviews slot on the site renders from this list, so add new reviews here.
// Left out on purpose: star-only ratings (they count in the bars) and two complaints
// (a rude cashier, the approach road), which are in knowledge.md.
const REVIEWS = {
  google: {
    rating: 4.2,
    count: 28,
    bars: { 5: 14, 4: 10, 3: 2, 2: 0, 1: 2 },
    url: 'https://search.google.com/local/reviews?placeid=ChIJe_MXYcRxqDsRF4IPtjK3dOM',
    write: 'https://search.google.com/local/writereview?placeid=ChIJe_MXYcRxqDsRF4IPtjK3dOM',
  },
  justdial: {
    rating: 4.5,
    count: 8,
    url: 'https://www.justdial.com/Palakkad/VAR-Mart-Puduppariyaram/9999PX491-X491-140418223919-F4J2_BZDET/reviews',
  },
  list: [
    { name: 'Madhavan Kutty', source: 'google', stars: 4, date: 'Jul 2025', text: 'Excellent service. Very competitive rates for all products including Rice, grocery, plastic & other stationary items. Good people extending best services.' },
    { name: 'Kishor Krishnamoorthy', source: 'google', stars: 5, date: 'Feb 2024', text: 'Great service and Good Quality of Products' },
    { name: 'Gopakumar S', source: 'google', stars: 5, date: 'Mar 2019', text: 'Very good place to purchase price, genuine people. All the way satisfying purchase.' },
    { name: 'Vidya K Moothathu', source: 'google', stars: 4, date: 'Sep 2023', text: 'Everything in atleast Rs.1 offer & upto 20' },
    { name: 'Anoop', source: 'justdial', date: 'Mar 2014', text: 'Excellent' },
    { name: 'ExploReR', source: 'google', stars: 5, date: 'May 2019', text: 'Very good quality at an affordable rate. Near and clean.. They serve better through modern amenities.. The packaging is good. It’s always crowded and that tells us the quality.' },
    { name: 'Rajesh R', source: 'google', stars: 5, date: 'Aug 2024', text: 'Quality 1st' },
    { name: 'Bijo John', source: 'google', stars: 5, date: 'Mar 2019', text: 'Comparing to other shops 5 to 6 rupees profit will get for one kg rice' },
    { name: 'Satheesan Velayudhapanicker', source: 'google', stars: 4, date: 'Feb 2020', text: 'Various types of modern rice, soap, shampoo, different types of oils are available in normal rates.' },
    { name: 'subin Ms', source: 'justdial', date: 'Oct 2020', text: 'Good' },
    { name: 'Mr Tom', source: 'google', stars: 5, date: 'Apr 2019', text: 'In here you can get rice @ very low price.' },
  ],
};

const G_LOGO = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const JD_LOGO = '<span class="jd-logo" aria-hidden="true">Jd</span>';

// Reviews are pasted from other sites, so escape them before they go into innerHTML
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const stars = (r) => `<span class="stars" style="--r: ${r}" role="img" aria-label="${r} out of 5 stars">★★★★★</span>`;

function reviewSummary() {
  const g = REVIEWS.google;
  const j = REVIEWS.justdial;
  const bars = [5, 4, 3, 2, 1].map((n) => `
    <li><span>${n}★</span><span class="rv-bar"><i style="width: ${(g.bars[n] / g.count) * 100}%"></i></span><span>${g.bars[n]}</span></li>`).join('');
  return `
  <div class="rv-summary grid">
    <a class="rv-score" href="${g.url}" target="_blank" rel="noopener">
      <span class="rv-score__src">${G_LOGO}Google reviews</span>
      <span class="rv-score__num">${g.rating}</span>
      ${stars(g.rating)}
      <span class="label muted">${g.count} reviews</span>
    </a>
    <ul class="rv-bars" aria-label="Google star breakdown">${bars}</ul>
    <a class="rv-score" href="${j.url}" target="_blank" rel="noopener">
      <span class="rv-score__src">${JD_LOGO}Justdial</span>
      <span class="rv-score__num">${j.rating}</span>
      ${stars(j.rating)}
      <span class="label muted">${j.count} ratings</span>
    </a>
    <div class="rv-links">
      <a class="btn btn--green" href="${g.url}" target="_blank" rel="noopener">Read all on Google</a>
      <a class="label link-arrow" href="${g.write}" target="_blank" rel="noopener">Write a review</a>
    </div>
  </div>`;
}

function reviewCard(r, n) {
  const google = r.source === 'google';
  return `
    <figure class="rv-card">
      <figcaption class="rv-card__who">
        <span class="rv-avatar${n % 2 ? ' rv-avatar--green' : ''}" aria-hidden="true">${esc(r.name[0].toUpperCase())}</span>
        <span><b>${esc(r.name)}</b><span class="rv-card__meta">${google ? 'Google' : 'Justdial'} review · ${esc(r.date)}</span></span>
        ${google ? G_LOGO : JD_LOGO}
      </figcaption>
      ${r.stars ? stars(r.stars) : ''}
      <blockquote>“${esc(r.text)}”</blockquote>
    </figure>`;
}

// Cards scroll sideways in a loop: the set is drawn twice and the track slides by one set
document.querySelectorAll('.js-reviews').forEach((slot) => {
  const cards = REVIEWS.list.map(reviewCard).join('');
  slot.innerHTML = `
    ${slot.dataset.summary === 'false' ? '' : reviewSummary()}
    <div class="rv-marquee" aria-label="Customer reviews">
      <div class="rv-track">
        <div class="rv-set">${cards}</div>
        <div class="rv-set" aria-hidden="true">${cards}</div>
      </div>
    </div>`;
  const set = slot.querySelector('.rv-set');
  // About 45px a second, slower on phones where the cards fill the screen
  const speed = matchMedia('(max-width: 767px)').matches ? 22 : 45;
  slot.querySelector('.rv-track').style.setProperty('--dur', `${set.scrollWidth / speed}s`);
});

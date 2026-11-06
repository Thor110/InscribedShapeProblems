// Adds the same navigation bar to the top of every page (pages/site.css styles it).
// Plain script, no build step; works on file:// as well as on the website.
(function () {
  'use strict';
  const PAGES = [
    ['inscribed-square-viewfinder.html', 'Square viewfinder'],
    ['inscribed-cube-viewfinder.html', 'Cube viewfinder'],
    ['skeletal-shapefinder.html', 'Shape finder'],
    ['skeletal-spacefinder.html', 'Space finder'],
    ['dimension-explorer.html', 'Dimensions'],
    ['inscribed-study.html', 'Studies'],
    ['certificate.html', 'Certificate'],
    ['paper.html', 'Paper'],
    ['registry.html', 'Results'],
    ['number-stability.html', 'Perfect numbers'],
  ];
  function build() {
    if (document.querySelector('.site-nav')) return;
    const here = location.pathname.split('/').pop();
    const nav = document.createElement('nav');
    nav.className = 'site-nav'; nav.setAttribute('aria-label', 'Site');
    const link = (href, text, cls) => { const a = document.createElement('a'); a.href = href; a.textContent = text; if (cls) a.className = cls; if (href === here) a.setAttribute('aria-current', 'page'); return a; };
    nav.appendChild(link('../index.html', '⌂ Home', 'home'));
    for (const [href, text] of PAGES) nav.appendChild(link(href, text));
    document.body.insertBefore(nav, document.body.firstChild);
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();

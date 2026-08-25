/* ==========================================================================
   DAN MILBOURN CONSTRUCTION — interaction layer
   Vanilla JS. No dependencies. Interaction communicates information.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. STICKY HEADER ---------- */
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var onHero = hdr.classList.contains('hdr--onhero');
    var solidAt = onHero ? Math.max(120, window.innerHeight * 0.55) : 24;
    var tick = false;
    function syncHeader() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      hdr.classList.toggle('hdr--solid', y > solidAt);
      tick = false;
    }
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; window.requestAnimationFrame(syncHeader); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      solidAt = onHero ? Math.max(120, window.innerHeight * 0.55) : 24;
      syncHeader();
    });
    syncHeader();
  }

  /* ---------- 2. MOBILE DRAWER ---------- */
  var burger = document.querySelector('.hdr__burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    var lastFocus = null;
    function setNav(open) {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { lastFocus = document.activeElement; var f = drawer.querySelector('a'); if (f) f.focus(); }
      else if (lastFocus) { lastFocus.focus(); }
    }
    burger.addEventListener('click', function () {
      setNav(!document.body.classList.contains('nav-open'));
    });
    drawer.addEventListener('click', function (e) { if (e.target.tagName === 'A') setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setNav(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1023 && document.body.classList.contains('nav-open')) setNav(false);
    });
  }

  /* ---------- 3. SCROLL REVEAL ---------- */
  var revealables = document.querySelectorAll('[data-reveal], [data-reveal-mask]');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
          setTimeout(function () { el.classList.add('is-in'); }, delay);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
    }
  }

  /* stagger groups: assign incremental delays to children */
  Array.prototype.forEach.call(document.querySelectorAll('[data-stagger]'), function (group) {
    var step = parseInt(group.getAttribute('data-stagger') || '90', 10);
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (child.hasAttribute('data-reveal') && !child.hasAttribute('data-delay')) {
        child.setAttribute('data-delay', String(i * step));
      }
    });
  });

  /* timeline markers */
  var tlItems = document.querySelectorAll('.tl__item');
  if (tlItems.length && 'IntersectionObserver' in window) {
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); tio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(tlItems, function (el) { tio.observe(el); });
  } else {
    Array.prototype.forEach.call(tlItems, function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 4. PARALLAX (restrained, desktop only) ---------- */
  var plx = document.querySelectorAll('[data-parallax]');
  if (plx.length && !reduced && window.innerWidth > 900) {
    var pTick = false;
    function runParallax() {
      Array.prototype.forEach.call(plx, function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var amt = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = 'translate3d(0,' + (-mid * amt).toFixed(1) + 'px,0)';
      });
      pTick = false;
    }
    window.addEventListener('scroll', function () {
      if (!pTick) { pTick = true; window.requestAnimationFrame(runParallax); }
    }, { passive: true });
    runParallax();
  }

  /* ---------- 5. TESTIMONIAL SLIDER ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-quotes]'), function (root) {
    var slides = root.querySelectorAll('.quote');
    if (slides.length < 2) return;
    var i = 0;
    var prev = root.querySelector('[data-q-prev]');
    var next = root.querySelector('[data-q-next]');
    var count = root.querySelector('[data-q-count]');
    function show(n) {
      i = (n + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) {
        if (k === i) { s.setAttribute('data-active', ''); } else { s.removeAttribute('data-active'); }
      });
      if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    }
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(i - 1); }
      if (e.key === 'ArrowRight') { show(i + 1); }
    });
    show(0);
  });

  /* ---------- 6. BEFORE / AFTER SLIDER ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-ba]'), function (frame) {
    var handle = frame.querySelector('.ba__handle');
    if (!handle) return;
    var dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty('--pos', pct + '%');
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setPos((x / r.width) * 100);
    }
    function start(e) { dragging = true; fromEvent(e); e.preventDefault(); }
    function move(e) { if (dragging) fromEvent(e); }
    function end() { dragging = false; }

    frame.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    frame.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
    frame.addEventListener('dblclick', function () { setPos(50); });

    handle.addEventListener('keydown', function (e) {
      var cur = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      var step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft')  { setPos(cur - step); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPos(cur + step); e.preventDefault(); }
      if (e.key === 'Home')       { setPos(0);  e.preventDefault(); }
      if (e.key === 'End')        { setPos(100); e.preventDefault(); }
    });
    setPos(50);
  });

  /* ---------- 7. LIGHTBOX ---------- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg   = lb.querySelector('[data-lb-img]');
    var lbTitle = lb.querySelector('[data-lb-title]');
    var lbDesc  = lb.querySelector('[data-lb-desc]');
    var lbScope = lb.querySelector('[data-lb-scope]');
    var lbCount = lb.querySelector('[data-lb-count]');
    var lbClose = lb.querySelector('.lb__close');
    var lbPrev  = lb.querySelector('[data-lb-prev]');
    var lbNext  = lb.querySelector('[data-lb-next]');
    var items = [], idx = 0, opener = null;

    function collect() {
      items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    }
    function render() {
      var el = items[idx];
      if (!el) return;
      var img = el.querySelector('img');
      lbImg.src = el.getAttribute('data-full') || (img ? img.src : '');
      lbImg.alt = el.getAttribute('data-alt') || (img ? img.alt : '');
      lbTitle.textContent = el.getAttribute('data-title') || '';
      lbDesc.textContent  = el.getAttribute('data-desc') || '';
      var scope = el.getAttribute('data-scope') || '';
      lbScope.textContent = scope;
      lbScope.style.display = scope ? '' : 'none';
      if (lbCount) lbCount.textContent = (idx + 1) + ' / ' + items.length;
      var multi = items.length > 1;
      if (lbPrev) lbPrev.style.display = multi ? '' : 'none';
      if (lbNext) lbNext.style.display = multi ? '' : 'none';
    }
    function open(el) {
      collect();
      idx = items.indexOf(el);
      if (idx < 0) idx = 0;
      opener = el;
      render();
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-open');
      lbClose.focus();
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      if (opener) opener.focus();
    }
    function step(d) { idx = (idx + d + items.length) % items.length; render(); }

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-lightbox]') : null;
      if (t) { e.preventDefault(); open(t); }
    });
    lbClose.addEventListener('click', close);
    if (lbPrev) lbPrev.addEventListener('click', function () { step(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__stage')) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { step(-1); }
      else if (e.key === 'ArrowRight') { step(1); }
      else if (e.key === 'Tab') {
        // focus trap
        var f = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        var vis = Array.prototype.filter.call(f, function (n) { return n.offsetParent !== null; });
        if (!vis.length) return;
        var first = vis[0], last = vis[vis.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });

    // touch swipe
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- 8. CONTACT FORM (Formspree, AJAX with graceful fallback) ---------- */
  var form = document.getElementById('estimate-form');
  if (form && window.fetch) {
    var ok  = form.querySelector('[data-form-ok]');
    var bad = form.querySelector('[data-form-bad]');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (ok) ok.textContent = '';
      if (bad) bad.textContent = '';
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (r) {
        if (r.ok) {
          form.reset();
          if (ok) ok.textContent = 'Thank you — your request has been sent. We will be in touch shortly.';
        } else {
          return r.json().then(function (d) {
            throw new Error((d && d.errors && d.errors.map(function (x) { return x.message; }).join(', ')) || 'Submission failed.');
          });
        }
      }).catch(function (err) {
        if (bad) bad.textContent = err.message + ' Please call (314) 772-0190 and we will help you directly.';
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send Request'; }
      });
    });
  }

  /* ---------- 9. FOOTER YEAR ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

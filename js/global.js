document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // MENU MOBILE
  // ============================================================
  const toggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Fechar ao clicar em link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        toggle.classList.remove('active');
        navLinks.classList.remove('open');
      }
    });
  }

  // ============================================================
  // NAVBAR SCROLL
  // ============================================================
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ============================================================
  // STATUS ABERTO / FECHADO
  // Horário: Seg–Sex 08h–18h | Sáb 08h–12h30 | Dom/Feriado: fechado
  // ============================================================
  function updateStatus() {
    const badges = document.querySelectorAll('.status-badge');
    if (!badges.length) return;

    const now = new Date();
    const day  = now.getDay();  // 0=Dom, 1=Seg... 6=Sáb
    const hour = now.getHours();
    const min  = now.getMinutes();
    const totalMin = hour * 60 + min;

    let isOpen = false;
    let nextOpen = '';

    if (day >= 1 && day <= 5) {
      // Seg–Sex: 08:00–18:00
      isOpen = totalMin >= 480 && totalMin < 1080;
      if (!isOpen) {
        nextOpen = totalMin < 480 ? '08h' : 'Segunda às 08h';
      }
    } else if (day === 6) {
      // Sáb: 08:00–12:30
      isOpen = totalMin >= 480 && totalMin < 750;
      if (!isOpen) {
        nextOpen = totalMin < 480 ? '08h' : 'Segunda às 08h';
      }
    } else {
      // Dom: fechado
      nextOpen = 'Segunda às 08h';
    }

    badges.forEach(badge => {
      badge.classList.remove('open', 'closed');
      if (isOpen) {
        badge.classList.add('open');
        badge.innerHTML = '<span class="status-dot"></span>Abertos agora';
      } else {
        badge.classList.add('closed');
        badge.innerHTML = `<span class="status-dot"></span>Fechado · Abre ${nextOpen}`;
      }
    });
  }

  updateStatus();
  setInterval(updateStatus, 30000); // Atualiza a cada 30s

  // ============================================================
  // POPUP
  // ============================================================
  const popup = document.getElementById('popup');
  const closeBtn = document.getElementById('close-popup');

  if (popup) {
    // Mostrar após 4s
    const popupTimer = setTimeout(() => {
      popup.classList.add('show');
    }, 4000);

    // Fechar
    function closePopup() {
      popup.classList.remove('show');
      clearTimeout(popupTimer);
    }

    if (closeBtn) closeBtn.addEventListener('click', closePopup);

    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePopup();
    });
  }

  // ============================================================
  // SCROLL REVEAL
  // ============================================================
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  // ============================================================
  // PARTÍCULAS DE ÁGUA (Canvas)
  // ============================================================
  const canvas = document.getElementById('water-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = window.innerWidth < 768 ? 30 : 60;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.1,
      alpha: Math.random() * 0.4 + 0.1,
      life: Math.random(),
    });
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.life += 0.003;

      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
        p.life = 0;
      }

      const alpha = p.alpha * Math.sin(p.life * Math.PI);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animateParticles);
  }

  animateParticles();

});

/* ==========================================================
   HERO CAROUSEL
   ========================================================== */

const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');

if (slides.length) {

  let currentSlide = 0;

  setInterval(() => {

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide++;

    if (currentSlide >= slides.length) {
      currentSlide = 0;
    }

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');

  }, 4000);

}
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollReveal();
    initBook3dTilt();
    initAlchemyDustCanvas();
    initRatingBarsAnimation();
    initOrderModal();
});

function initNavbar() {
    const header = document.getElementById('mainHeader');
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) { header?.classList.add('scrolled'); }
        else { header?.classList.remove('scrolled'); }
        highlightCurrentSection();
    }, { passive: true });

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('open');
                navToggle.classList.remove('open');
            });
        });
    }

    function highlightCurrentSection() {
        const sections = document.querySelectorAll('section[id], footer[id]');
        const scrollPos = window.scrollY + 200;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.getAttribute('href') === `#${id}` ? link.classList.add('active') : link.classList.remove('active');
                });
            }
        });
    }
}

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-zoom-in');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
            });
        }, { root: null, threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealElements.forEach(el => observer.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('is-visible'));
    }
}

function initBook3dTilt() {
    const book = document.getElementById('heroBook3d');
    if (!book) return;
    const maxTilt = 16;
    book.addEventListener('mousemove', (e) => {
        const rect = book.getBoundingClientRect();
        const tiltX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -maxTilt;
        const tiltY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * maxTilt;
        book.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.04,1.04,1.04)`;
    });
    book.addEventListener('mouseleave', () => { book.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'; });
}

function initAlchemyDustCanvas() {
    const canvas = document.getElementById('alchemyDustCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 42;

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
        canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class DustParticle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.2 + 0.6;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = -Math.random() * 0.5 - 0.15;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.fadeSpeed = Math.random() * 0.008 + 0.003;
            this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
        }
        update() {
            this.x += this.speedX; this.y += this.speedY;
            this.opacity += this.fadeSpeed * this.fadeDirection;
            if (this.opacity > 0.85) { this.opacity = 0.85; this.fadeDirection = -1; }
            else if (this.opacity < 0.1) { this.opacity = 0.1; this.fadeDirection = 1; }
            if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) { this.reset(); this.y = canvas.height + 5; }
        }
        draw() {
            ctx.save(); ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(228,197,124,${this.opacity})`;
            ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(201,160,80,0.7)';
            ctx.fill(); ctx.restore();
        }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new DustParticle());
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

function initRatingBarsAnimation() {
    const breakdownSection = document.getElementById('ratingBreakdown');
    if (!breakdownSection) return;
    const barFills = breakdownSection.querySelectorAll('.rating-bar-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                barFills.forEach(bar => { bar.style.width = `${bar.getAttribute('data-percent') || 0}%`; });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(breakdownSection);
}

function initOrderModal() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.getElementById('closeOrderModal');
    const triggers = document.querySelectorAll('.buy-book-trigger');
    if (!modal) return;

    triggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

window.updateOrderPrice = function (quantity) {
    const priceDisplay = document.getElementById('orderTotalPrice');
    if (!priceDisplay) return;
    const total = 129000 * (parseInt(quantity, 10) || 1);
    priceDisplay.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
};

window.handleOrderSubmit = function () {
    const name = document.getElementById('customerName')?.value || 'Quý khách';
    alert(`Cảm ơn bạn ${name} đã đặt mua "Nhà Giả Kim"!\nĐơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ xác nhận sớm nhất.`);
    const modal = document.getElementById('orderModal');
    if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
};

/* ============================================================
   ORDER.JS — Trang đặt hàng + Star Picker feedback
   Không dùng localStorage, không fake API.
   Chỉ xử lý UI: stepper số lượng, tính tiền, star picker, validate form cơ bản.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initFeedbackStarPicker();
    initFeedbackFormValidation();
    initOrderQtyStepper();
    initOrderSummaryCalc();
    initOrderFormValidation();
    initScrollRevealForNewElements();
    initOrderPageHeader();
});

/* ============================================================
   STAR PICKER — Feedback form trong index.html
   Cho phép click chọn số sao, cập nhật hidden input StarRating
   ============================================================ */
function initFeedbackStarPicker() {
    const picker = document.getElementById('starPicker');
    const hiddenInput = document.getElementById('feedbackStarRating');
    if (!picker || !hiddenInput) return;

    const starBtns = picker.querySelectorAll('.star-btn');

    starBtns.forEach((btn) => {
        // Hover highlight
        btn.addEventListener('mouseenter', () => {
            const hoverVal = parseInt(btn.dataset.value, 10);
            starBtns.forEach((b) => {
                const bVal = parseInt(b.dataset.value, 10);
                b.classList.toggle('highlighted', bVal <= hoverVal);
            });
        });

        btn.addEventListener('mouseleave', () => {
            starBtns.forEach((b) => b.classList.remove('highlighted'));
        });

        // Click để chọn
        btn.addEventListener('click', () => {
            const selectedVal = parseInt(btn.dataset.value, 10);
            hiddenInput.value = selectedVal;

            starBtns.forEach((b) => {
                const bVal = parseInt(b.dataset.value, 10);
                b.classList.toggle('active', bVal <= selectedVal);
            });
        });
    });
}

/* ============================================================
   FEEDBACK FORM VALIDATION (chỉ hiển thị thông báo UI)
   Không submit thực — sau này form sẽ POST tới /Feedback/Create
   ============================================================ */
function initFeedbackFormValidation() {
    const form = document.getElementById('feedbackForm');
    const msgBox = document.getElementById('feedbackFormMessage');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        // Validation cơ bản trước khi gửi
        const name = form.querySelector('[name="CustomerName"]')?.value?.trim();
        const email = form.querySelector('[name="Email"]')?.value?.trim();
        const content = form.querySelector('[name="Content"]')?.value?.trim();
        const starRating = parseInt(form.querySelector('[name="StarRating"]')?.value, 10);

        const errors = [];
        if (!name) errors.push('Vui lòng nhập họ và tên.');
        if (!email || !isValidEmail(email)) errors.push('Vui lòng nhập email hợp lệ.');
        if (!starRating || starRating < 1 || starRating > 5) errors.push('Vui lòng chọn số sao đánh giá.');
        if (!content || content.length < 10) errors.push('Nội dung đánh giá cần ít nhất 10 ký tự.');

        if (!msgBox) return;

        if (errors.length > 0) {
            e.preventDefault();
            showFormMessage(msgBox, errors.join(' '), 'error');
            return;
        }

        // Nếu hợp lệ, để form submit bình thường tới backend ASP.NET Core
    });
}

/* ============================================================
   ORDER QTY STEPPER — Trang order.html
   Tăng / giảm số lượng, tự động cập nhật thành tiền
   ============================================================ */
function initOrderQtyStepper() {
    // Tăng
    document.querySelectorAll('.qty-increase').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            const max = parseInt(input.max, 10) || 99;
            const cur = parseInt(input.value, 10) || 1;
            if (cur < max) {
                input.value = cur + 1;
                recalcOrderItem(input);
            }
        });
    });

    // Giảm
    document.querySelectorAll('.qty-decrease').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            const min = parseInt(input.min, 10) || 1;
            const cur = parseInt(input.value, 10) || 1;
            if (cur > min) {
                input.value = cur - 1;
                recalcOrderItem(input);
            }
        });
    });

    // Gõ tay vào input
    document.querySelectorAll('.qty-input').forEach((input) => {
        input.removeAttribute('readonly');
        input.addEventListener('change', () => {
            const min = parseInt(input.min, 10) || 1;
            const max = parseInt(input.max, 10) || 99;
            let val = parseInt(input.value, 10) || min;
            val = Math.max(min, Math.min(max, val));
            input.value = val;
            recalcOrderItem(input);
        });
    });
}

/**
 * Tính thành tiền cho 1 dòng sản phẩm, cập nhật DOM, rồi gọi tổng kết.
 * @param {HTMLInputElement} qtyInput
 */
function recalcOrderItem(qtyInput) {
    const item = qtyInput.closest('.order-product-item');
    if (!item) return;

    const unitPriceEl = item.querySelector('.order-unit-price');
    const subtotalEl = item.querySelector('.order-subtotal');

    const unitPrice = parseInt(unitPriceEl?.dataset.unitPrice, 10) || 0;
    const qty = parseInt(qtyInput.value, 10) || 1;
    const subtotal = unitPrice * qty;

    if (subtotalEl) {
        subtotalEl.textContent = formatVND(subtotal);
    }

    recalcOrderSummary();
}

/* ============================================================
   ORDER SUMMARY CALCULATION — Trang order.html
   Tổng tiền = Tổng thành tiền + Phí ship (miễn nếu >= 2 cuốn)
   ============================================================ */
const SHIPPING_FEE = 30000;
const FREE_SHIP_QTY_THRESHOLD = 2;

function initOrderSummaryCalc() {
    recalcOrderSummary();
}

function recalcOrderSummary() {
    let subtotalRaw = 0;
    let totalQty = 0;

    document.querySelectorAll('.order-product-item').forEach((item) => {
        const qtyInput = item.querySelector('.qty-input');
        const unitPriceEl = item.querySelector('.order-unit-price');
        const qty = parseInt(qtyInput?.value, 10) || 1;
        const unitPrice = parseInt(unitPriceEl?.dataset.unitPrice, 10) || 0;
        subtotalRaw += unitPrice * qty;
        totalQty += qty;
    });

    const shippingFee = totalQty >= FREE_SHIP_QTY_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotalRaw + shippingFee;

    const subtotalEl = document.getElementById('summarySubtotal');
    const shippingEl = document.getElementById('summaryShipping');
    const totalEl = document.getElementById('summaryTotal');

    if (subtotalEl) subtotalEl.textContent = formatVND(subtotalRaw);
    if (shippingEl) shippingEl.textContent = shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee);
    if (totalEl) totalEl.textContent = formatVND(total);
}

/* ============================================================
   ORDER FORM VALIDATION — Trang order.html
   ============================================================ */
function initOrderFormValidation() {
    const form = document.getElementById('orderPageForm');
    const msgBox = document.getElementById('orderFormMessage');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        const fullName = form.querySelector('[name="Customer.FullName"], [name="FullName"]')?.value?.trim();
        const phone = form.querySelector('[name="Customer.Phone"], [name="Phone"]')?.value?.trim();
        const email = form.querySelector('[name="Customer.Email"], [name="Email"]')?.value?.trim();
        const address = form.querySelector('[name="Customer.Address"], [name="Address"]')?.value?.trim();

        const errors = [];
        if (!fullName) errors.push('Vui lòng nhập họ và tên.');
        if (!phone || !/^[0-9]{9,11}$/.test(phone)) errors.push('Số điện thoại không hợp lệ (9-11 chữ số).');
        if (!email || !isValidEmail(email)) errors.push('Vui lòng nhập email hợp lệ.');
        if (!address) errors.push('Vui lòng nhập địa chỉ nhận hàng.');

        if (!msgBox) return;

        if (errors.length > 0) {
            e.preventDefault();
            showFormMessage(msgBox, errors.join(' '), 'error');
            return;
        }

        // Form hợp lệ, submit bình thường tới backend
    });
}

/* ============================================================
   SCROLL REVEAL — Áp dụng cho các element mới được thêm vào
   ============================================================ */
function initScrollRevealForNewElements() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-zoom-in')
            .forEach(el => el.classList.add('is-visible'));
        return;
    }

    const revealEls = document.querySelectorAll(
        '.order-page .reveal-fade-up, .order-page .reveal-fade-left, .order-page .reveal-fade-right'
    );

    if (revealEls.length === 0) return;

    const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach(el => obs.observe(el));
}

/* ============================================================
   ORDER PAGE HEADER SCROLL EFFECT
   ============================================================ */
function initOrderPageHeader() {
    const header = document.getElementById('orderPageHeader');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

/* ============================================================
   UTILITIES
   ============================================================ */
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormMessage(msgBox, text, type) {
    msgBox.textContent = text;
    msgBox.className = `feedback-form-message ${type}`;
    msgBox.hidden = false;
    msgBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

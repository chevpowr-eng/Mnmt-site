// MNMT theme behaviour: mobile nav, product variant picker, coverage calculator,
// collection filters, and quote-form prefill.

document.querySelectorAll('[data-nav-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    document.body.classList.toggle('nav-open', !open);
  });
});

class ProductForm {
  constructor(root) {
    this.root = root;
    this.data = JSON.parse(root.querySelector('[data-product-json]').textContent);
    this.overage = Number(root.dataset.overage || 0) / 100;
    this.idInput = root.querySelector('[data-variant-id]');
    this.addButton = root.querySelector('[data-add-button]');
    this.quantity = root.querySelector('[data-quantity]');
    this.calc = root.querySelector('[data-calc]');
    this.area = root.querySelector('[data-calc-area]');
    this.calcResult = root.querySelector('[data-calc-result]');
    this.variant = this.data.variants.find((v) => String(v.id) === this.idInput?.value) || this.data.variants[0];

    root.querySelectorAll('[data-option-index]').forEach((input) => {
      input.addEventListener('change', () => this.onOptionChange());
    });
    this.area?.addEventListener('input', () => this.updateCalc());
  }

  selectedOptions() {
    const groups = {};
    this.root.querySelectorAll('[data-option-index]:checked').forEach((input) => {
      groups[input.dataset.optionIndex] = input.value;
    });
    return Object.keys(groups).sort().map((key) => groups[key]);
  }

  onOptionChange() {
    const options = this.selectedOptions();
    options.forEach((value, index) => {
      const label = this.root.querySelector(`[data-option-selected="${index}"]`);
      if (label) label.textContent = value;
    });

    const match = this.data.variants.find((v) => v.options.every((opt, i) => opt === options[i]));
    this.variant = match || null;

    if (this.idInput && match) this.idInput.value = match.id;
    this.updateButton();
    this.updatePrice();
    this.updateCalc();
    this.updateMedia();
    if (match) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', match.id);
      window.history.replaceState({}, '', url);
    }
  }

  updateButton() {
    if (!this.addButton) return;
    const available = this.variant && this.variant.available;
    this.addButton.disabled = !available;
    this.addButton.textContent = !this.variant ? 'Unavailable' : available ? 'Add to order' : 'Out of stock';
  }

  updatePrice() {
    const amount = this.root.querySelector('.price__amount');
    const unit = this.root.querySelector('.price__unit');
    if (!amount || !this.variant || this.variant.price === null) return;
    amount.textContent = this.variant.price;
    if (unit) unit.textContent = this.variant.unit ? ` / ${this.variant.unit}` : '';
  }

  updateCalc() {
    if (!this.calc) return;
    const perBox = this.variant ? Number(this.variant.sqftPerBox) : 0;
    this.calc.hidden = !perBox;
    if (!perBox || !this.area) return;

    const area = Number(this.area.value);
    if (!area) {
      this.calcResult.textContent = '';
      return;
    }
    const boxes = Math.ceil((area * (1 + this.overage)) / perBox);
    const covered = (boxes * perBox).toFixed(1);
    const perSqft = /sq\s*ft/i.test(this.variant.unit || '');
    this.calcResult.textContent = perSqft
      ? `Order ${boxes} sq ft`
      : `${boxes} ${boxes === 1 ? 'box' : 'boxes'} (${covered} sq ft)`;
    if (this.quantity) this.quantity.value = boxes;
  }

  updateMedia() {
    if (!this.variant || !this.variant.mediaId) return;
    const target = this.root.querySelector(`[data-media-id="${this.variant.mediaId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
}

document.querySelectorAll('[data-product]').forEach((root) => new ProductForm(root));

// Collection filters submit on change so the page reloads with the new filter params.
document.querySelectorAll('[data-filters]').forEach((form) => {
  form.addEventListener('change', () => form.submit());
});

// Quote form: prefill the product field from ?product= on the URL.
const params = new URLSearchParams(window.location.search);
document.querySelectorAll('[data-prefill-param]').forEach((input) => {
  const value = params.get(input.dataset.prefillParam);
  if (value && !input.value) input.value = value;
});

// Specifier credit: a designer's personal link (?s=CODE) tags the cart with their
// code so the order is credited to them. The cart page shows who is credited.
const Specifier = {
  key: 'mnmt_specifier',
  list: window.MNMT_SPECIFIERS || {},
  normalize(code) {
    return String(code || '').trim().toUpperCase();
  },
  isValid(code) {
    return Object.prototype.hasOwnProperty.call(this.list, this.normalize(code));
  },
  remembered() {
    try { return localStorage.getItem(this.key) || ''; } catch (e) { return ''; }
  },
  remember(code) {
    try { localStorage.setItem(this.key, code); } catch (e) { /* storage blocked */ }
  },
  save(code) {
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ attributes: { Specifier: code } }),
    });
  },
  init() {
    const params = new URLSearchParams(window.location.search);
    const fromLink = this.normalize(params.get('s'));
    if (fromLink && this.isValid(fromLink)) {
      this.remember(fromLink);
      this.save(fromLink);
      return;
    }
    const remembered = this.remembered();
    if (remembered && this.isValid(remembered)) this.save(remembered);
  },
};
Specifier.init();

document.querySelectorAll('[data-specifier]').forEach((root) => {
  const form = root.closest('form');
  const input = root.querySelector('[data-specifier-input]');
  const none = root.querySelector('[data-specifier-none]');
  const status = root.querySelector('[data-specifier-status]');
  const credited = root.querySelector('[data-specifier-credited]');
  const editor = root.querySelector('[data-specifier-editor]');
  const change = root.querySelector('[data-specifier-change]');
  const error = root.querySelector('[data-specifier-error]');
  const hidden = root.querySelector('[data-specifier-value]');

  const remembered = Specifier.remembered();
  if (input && !input.value && remembered && Specifier.isValid(remembered)) input.value = remembered;
  if (input && !input.value && Specifier.isValid(window.MNMT_OWN_SPECIFIER)) input.value = window.MNMT_OWN_SPECIFIER;

  const sync = () => {
    const code = Specifier.normalize(input?.value);
    if (none?.checked) {
      hidden.value = 'None';
      status.textContent = '';
    } else if (Specifier.isValid(code)) {
      hidden.value = code;
      status.textContent = `Specified by ${Specifier.list[code]}`;
      Specifier.remember(code);
    } else {
      hidden.value = '';
      status.textContent = code ? 'We don\'t recognise that code.' : '';
    }
    if (input) input.disabled = !!none?.checked;
    error.hidden = true;
  };

  input?.addEventListener('input', sync);
  none?.addEventListener('change', sync);
  change?.addEventListener('click', () => {
    credited.hidden = true;
    editor.hidden = false;
    input?.focus();
  });
  if (editor && !editor.hidden) sync();

  form?.addEventListener('submit', (event) => {
    const submitter = event.submitter;
    if (!submitter || submitter.name !== 'checkout') return;
    if (hidden.value) return;
    event.preventDefault();
    error.hidden = false;
    editor.hidden = false;
    if (credited) credited.hidden = true;
    input?.focus();
  });
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = button.parentElement.querySelector('[data-copy-source]')?.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch (e) {
      button.textContent = 'Select and copy';
    }
  });
});

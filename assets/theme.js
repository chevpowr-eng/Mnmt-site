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
    this.calcResult.textContent = `${boxes} ${boxes === 1 ? 'box' : 'boxes'} (${covered} sq ft)`;
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

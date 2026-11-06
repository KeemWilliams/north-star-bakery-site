/* Author: Wakeem Williams
   Project: North Star Bakery
   File: products.js
   Purpose: Builds the "My Pre-Order List" planner on products.html.
   Needs shared.js (loaded first) for the storage helpers. */

/* The items for sale. Every price and detail comes from the page text. */
const PRODUCTS = [
  {
    id: "sourdough-boule",
    name: "Sourdough Boule",
    category: "breads",
    price: "$6 to $12 per loaf",
    description: "Shaped by hand and baked in the early morning."
  },
  {
    id: "seeded-country-loaf",
    name: "Seeded Country Loaf",
    category: "breads",
    price: "$6 to $12 per loaf",
    description: "Shaped by hand and baked in the early morning."
  },
  {
    id: "soft-sandwich-loaf",
    name: "Soft Sandwich Loaf",
    category: "breads",
    price: "$6 to $12 per loaf",
    description: "Shaped by hand and baked in the early morning."
  },
  {
    id: "signature-loaf",
    name: "Signature Loaf",
    category: "breads",
    price: "$9 each",
    description: "A hearty, slow-fermented round loaf with a deep, crackly crust."
  },
  {
    id: "flaky-pastries",
    name: "Flaky Pastries",
    category: "pastries",
    price: "$3 to $6 each",
    description: "Baked in small batches all day long."
  },
  {
    id: "cinnamon-swirls",
    name: "Cinnamon Swirls",
    category: "pastries",
    price: "$3 to $6 each",
    description: "Baked in small batches all day long."
  },
  {
    id: "cookies-dozen",
    name: "Cookies by the Dozen",
    category: "pastries",
    price: "$30 to $40 per dozen",
    description: "Baked in small batches all day long."
  },
  {
    id: "custom-cake",
    name: "Custom Cake",
    category: "cakes",
    price: "$35 to $120 depending on size and design",
    description: "For birthdays, weddings, and community events. Made to order with at least 72 hours' notice."
  }
];

/* The filter buttons. "all" is a special id that shows every product. */
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "breads", label: "Breads" },
  { id: "pastries", label: "Pastries and Cookies" },
  { id: "cakes", label: "Cakes" }
];

/* Page state: the picked items and the chosen filter */
let preorderList = [];
let activeCategory = "all";

/* ---------- Small helpers ---------- */

function getElement(id) {
  return document.getElementById(id);
}

function findProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

function isInList(productId) {
  return preorderList.some(function (item) {
    return item.id === productId;
  });
}

function getVisibleProducts() {
  return PRODUCTS.filter(function (product) {
    return activeCategory === "all" || product.category === activeCategory;
  });
}

function getCategoryLabel(categoryId) {
  const category = CATEGORIES.find(function (entry) {
    return entry.id === categoryId;
  });
  return category ? category.label : "All";
}

function pluralItems(count) {
  return count === 1 ? "1 item" : count + " items";
}

/* Build a small element with text. textContent keeps everything as plain text. */
function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

/* ---------- Changing the list ---------- */

/* Save the list, then redraw everything that depends on it. */
function applyListChange() {
  savePreorderList(preorderList);
  updateToggleButtons();
  renderMyList();
}

function toggleProduct(product) {
  if (isInList(product.id)) {
    preorderList = preorderList.filter(function (item) {
      return item.id !== product.id;
    });
  } else {
    preorderList.push({ id: product.id, name: product.name });
  }
  applyListChange();
}

function removeFromList(productId) {
  preorderList = preorderList.filter(function (item) {
    return item.id !== productId;
  });
  applyListChange();
  focusAfterListChange();
}

function clearList() {
  preorderList = [];
  applyListChange();
  getElement("myListHeading").focus();
}

/* A removed button cannot keep keyboard focus, so move it somewhere sensible. */
function focusAfterListChange() {
  const firstRemoveButton = document.querySelector("#myListItems button");
  if (firstRemoveButton) {
    firstRemoveButton.focus();
  } else {
    getElement("myListHeading").focus();
  }
}

/* ---------- Filter buttons ---------- */

function renderFilterButtons() {
  const container = getElement("categoryFilters");

  CATEGORIES.forEach(function (category) {
    const button = makeElement("button", "btn-outline", category.label);
    button.type = "button";
    button.dataset.category = category.id;
    button.addEventListener("click", function () {
      setCategory(category.id);
    });
    container.appendChild(button);
  });
}

function setCategory(categoryId) {
  activeCategory = categoryId;
  saveValue(STORAGE_KEYS.filter, categoryId);
  updateFilterButtons();
  renderProducts();
}

function updateFilterButtons() {
  const buttons = document.querySelectorAll("#categoryFilters button");
  buttons.forEach(function (button) {
    const isActive = button.dataset.category === activeCategory;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

/* ---------- Product cards ---------- */

function renderProducts() {
  const listElement = getElement("productList");
  const visibleProducts = getVisibleProducts();

  listElement.textContent = "";
  visibleProducts.forEach(function (product) {
    listElement.appendChild(createProductCard(product));
  });

  /* The status line is a live region, so screen readers announce the change */
  let message = "Showing " + pluralItems(visibleProducts.length);
  if (activeCategory !== "all") {
    message += " in " + getCategoryLabel(activeCategory);
  }
  getElement("filterStatus").textContent = message + ".";

  updateToggleButtons();
}

function createProductCard(product) {
  const card = makeElement("li", "product-card");
  card.appendChild(makeElement("h3", "", product.name));
  card.appendChild(makeElement("p", "", product.description));
  card.appendChild(makeElement("p", "price", product.price));

  /* The button's name is its visible text plus the hidden product name,
     for example "Add to list: Sourdough Boule" */
  const button = makeElement("button", "btn-outline");
  button.type = "button";
  button.dataset.productId = product.id;
  button.appendChild(makeElement("span", "", "Add to list"));
  button.appendChild(makeElement("span", "visually-hidden", ": " + product.name));
  button.addEventListener("click", function () {
    toggleProduct(product);
  });
  card.appendChild(button);

  return card;
}

/* Refresh each add/remove button to match the list (text and aria-pressed). */
function updateToggleButtons() {
  const buttons = document.querySelectorAll("#productList button");
  buttons.forEach(function (button) {
    const inList = isInList(button.dataset.productId);
    button.setAttribute("aria-pressed", inList ? "true" : "false");
    button.firstChild.textContent = inList ? "Remove from list" : "Add to list";
  });
}

/* ---------- The "My list" panel ---------- */

function renderMyList() {
  const itemsElement = getElement("myListItems");
  const count = preorderList.length;

  itemsElement.textContent = "";
  preorderList.forEach(function (item) {
    itemsElement.appendChild(createListRow(item));
  });

  getElement("listCount").textContent = count === 0
    ? "Your list has 0 items."
    : "Your list has " + pluralItems(count) + ".";
  getElement("listEmpty").hidden = count > 0;
  getElement("clearList").hidden = count === 0;
}

function createListRow(item) {
  const row = makeElement("li", "list-row");
  row.appendChild(makeElement("span", "", item.name));

  const removeButton = makeElement("button", "btn-outline", "Remove");
  removeButton.type = "button";
  removeButton.setAttribute("aria-label", "Remove " + item.name + " from list");
  removeButton.addEventListener("click", function () {
    removeFromList(item.id);
  });
  row.appendChild(removeButton);

  return row;
}

/* ---------- Start up ---------- */

function loadSavedState() {
  /* Keep only saved items that are still real products, with current names */
  preorderList = loadPreorderList().filter(function (item) {
    return findProduct(item.id);
  }).map(function (item) {
    return { id: item.id, name: findProduct(item.id).name };
  });

  const savedCategory = loadSaved(STORAGE_KEYS.filter, "all");
  const isKnownCategory = CATEGORIES.some(function (category) {
    return category.id === savedCategory;
  });
  activeCategory = isKnownCategory ? savedCategory : "all";
}

function initPlanner() {
  const layout = getElement("plannerLayout");
  if (!layout) {
    return;
  }

  loadSavedState();
  renderFilterButtons();
  updateFilterButtons();
  renderProducts();
  renderMyList();
  getElement("clearList").addEventListener("click", clearList);

  /* Tidy the saved list in storage too (drops unknown items) */
  savePreorderList(preorderList);
  layout.hidden = false;
}

initPlanner();

/* Author: Wakeem Williams
   Project: North Star Bakery
   File: shared.js
   Purpose: Code used on every page. It holds the localStorage key names,
   safe helpers for reading and writing storage, the saved pre-order list
   loader, and the item count shown on the Contact nav link. */

/* All localStorage keys live in one object so a name is never mistyped.
   Note: there is deliberately no key for allergy notes (health information). */
const STORAGE_KEYS = {
  list: "northStarPreorderList",     /* array of {id, name} the visitor picked */
  filter: "northStarProductFilter",  /* category id chosen on products.html */
  contact: "northStarContactDetails" /* {fullName, emailAddress} only */
};

const MAX_SAVED_LIST_ITEMS = 20;

/* Read one value from localStorage. Storage can throw (private browsing,
   blocked cookies) and saved text can be corrupted, so any problem returns
   the fallback instead of breaking the page. */
function loadSaved(key, fallback) {
  try {
    const rawText = localStorage.getItem(key);
    if (rawText === null) {
      return fallback;
    }
    return JSON.parse(rawText);
  } catch (error) {
    return fallback;
  }
}

/* Write one value to localStorage. Returns true if it worked, false if not. */
function saveValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

/* Remove one saved value. Silently does nothing if storage is unavailable. */
function removeSaved(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    /* nothing to remove, so nothing to do */
  }
}

/* Load the pre-order list and clean it. Saved data is untrusted, so keep
   only entries that are objects with a text id and name, drop repeats, and
   cap the length. Returns an array of {id, name}. */
function loadPreorderList() {
  const saved = loadSaved(STORAGE_KEYS.list, []);
  const cleanList = [];

  if (!Array.isArray(saved)) {
    return cleanList;
  }

  saved.forEach(function (entry) {
    const isValidEntry = entry && typeof entry.id === "string" && typeof entry.name === "string";
    const isRepeat = isValidEntry && cleanList.some(function (item) {
      return item.id === entry.id;
    });

    if (isValidEntry && entry.id && entry.name && !isRepeat && cleanList.length < MAX_SAVED_LIST_ITEMS) {
      cleanList.push({ id: entry.id.slice(0, 40), name: entry.name.slice(0, 60) });
    }
  });

  return cleanList;
}

function savePreorderList(list) {
  saveValue(STORAGE_KEYS.list, list);
  updateNavCount();
}

function clearPreorderList() {
  removeSaved(STORAGE_KEYS.list);
  updateNavCount();
}

/* Show the number of saved items on the Contact nav link, for example
   "Contact and Pre-Orders (2)". The count is hidden when the list is empty. */
function updateNavCount() {
  const contactLink = document.querySelector('nav a[href="contact.html"]');
  if (!contactLink) {
    return;
  }

  let countBadge = contactLink.querySelector(".nav-count");
  if (!countBadge) {
    countBadge = document.createElement("span");
    countBadge.className = "nav-count";
    contactLink.appendChild(countBadge);
  }

  const itemCount = loadPreorderList().length;
  countBadge.hidden = itemCount === 0;
  countBadge.textContent = itemCount === 0 ? "" : " (" + itemCount + ")";
}

/* Another tab may change the list, so keep this tab's count in step. */
window.addEventListener("storage", updateNavCount);

updateNavCount();

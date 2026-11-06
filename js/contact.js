/* Author: Wakeem Williams
   Project: North Star Bakery
   File: contact.js
   Purpose: Contact form on contact.html: validation with messages beside each
   field, pre-fill from the saved pre-order list, and remembering the visitor's
   name and email. Needs shared.js (loaded first) for the storage helpers. */

const MONDAY = 1;                 /* Date.getDay() value for Monday (closed) */
const CAKE_NOTICE_HOURS = 72;     /* custom cakes need this much notice */
const MS_PER_HOUR = 60 * 60 * 1000;

/* Fields that belong to one request (cleared after a successful submit) */
const REQUEST_FIELD_IDS = ["requestType", "pickupDate", "itemDetails", "allergyNotes"];

/* ---------- Date helpers ---------- */

/* Turn "2026-11-08" into a Date at local midnight. new Date("2026-11-08")
   would read it as UTC and can land on the previous day, which would break
   the Monday and past-date checks. Returns null if the text is not a real date. */
function parseLocalDate(text) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!parts) {
    return null;
  }
  const year = Number(parts[1]);
  const monthIndex = Number(parts[2]) - 1;
  const day = Number(parts[3]);
  const date = new Date(year, monthIndex, day);

  /* Reject dates like 2026-02-31 that JavaScript would roll forward */
  return date.getMonth() === monthIndex ? date : null;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/* The first pickup day that is 72 hours away and not a Monday */
function earliestCakeDate() {
  let day = startOfDay(new Date(Date.now() + CAKE_NOTICE_HOURS * MS_PER_HOUR));
  while (day.getDay() === MONDAY) {
    day = addDays(day, 1);
  }
  return day;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/* ---------- Validation rules ----------
   One rule per field id. Each rule gets the field's trimmed text and all the
   form values, and returns an error message, or "" when the field is fine. */

const RULES = {
  fullName: function (value) {
    if (value === "") {
      return "Enter your full name.";
    }
    if (value.length < 2 || value.length > 60) {
      return "Your name needs 2 to 60 characters.";
    }
    if (!/^[A-Za-z .'-]+$/.test(value)) {
      return "Use only letters, spaces, periods, apostrophes, and hyphens.";
    }
    return "";
  },

  emailAddress: function (value) {
    if (value === "") {
      return "Enter your email address.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Enter an email address like name@example.com.";
    }
    return "";
  },

  requestType: function (value) {
    return value === "" ? "Choose a request type." : "";
  },

  pickupDate: function (value, values) {
    const needsDate = values.requestType === "pre-order" || values.requestType === "cake-order";
    if (!needsDate) {
      return "";
    }
    if (value === "") {
      return "Choose a pickup date.";
    }
    const date = parseLocalDate(value);
    if (!date) {
      return "Enter a real date.";
    }
    if (date < startOfDay(new Date())) {
      return "The pickup date cannot be in the past.";
    }
    if (date.getDay() === MONDAY) {
      return "We are closed on Mondays. Choose Tuesday to Sunday.";
    }
    if (values.requestType === "cake-order" && date < earliestCakeDate()) {
      return "Custom cakes need at least 72 hours' notice. The earliest pickup is " +
        formatDate(earliestCakeDate()) + ".";
    }
    return "";
  },

  itemDetails: function (value) {
    if (value === "") {
      return "Tell us what you would like.";
    }
    if (value.length < 5) {
      return "Add a little more detail (at least 5 characters).";
    }
    if (value.length > 500) {
      return "Keep item details to 500 characters or fewer (now " + value.length + ").";
    }
    return "";
  },

  allergyNotes: function (value) {
    return value.length > 300
      ? "Keep allergy notes to 300 characters or fewer (now " + value.length + ")."
      : "";
  }
};

/* Field ids in page order, used to find the first invalid field */
const FIELD_IDS = Object.keys(RULES);

/* ---------- Reading and showing field state ---------- */

function getField(fieldId) {
  return document.getElementById(fieldId);
}

function getErrorElement(fieldId) {
  return document.getElementById(fieldId + "-error");
}

function getValues() {
  const values = {};
  FIELD_IDS.forEach(function (fieldId) {
    values[fieldId] = getField(fieldId).value.trim();
  });
  return values;
}

/* Put a message in the field's error element, or clear it when message is "" */
function showFieldError(fieldId, message) {
  const field = getField(fieldId);
  const errorElement = getErrorElement(fieldId);

  if (message) {
    errorElement.textContent = "Error: " + message;
    field.setAttribute("aria-invalid", "true");
  } else {
    errorElement.textContent = "";
    field.removeAttribute("aria-invalid");
  }
}

/* Check one field and show its result. Returns true when the field is valid. */
function validateField(fieldId) {
  const values = getValues();
  const message = RULES[fieldId](values[fieldId], values);
  showFieldError(fieldId, message);
  return message === "";
}

/* Check every field. Returns the id of the first invalid field, or "" if none. */
function validateAllFields() {
  let firstInvalidId = "";
  FIELD_IDS.forEach(function (fieldId) {
    const isValid = validateField(fieldId);
    if (!isValid && firstInvalidId === "") {
      firstInvalidId = fieldId;
    }
  });
  return firstInvalidId;
}

/* While a field shows an error, re-check it as the visitor types so the
   message disappears the moment the problem is fixed. */
function recheckIfInvalid(fieldId) {
  if (getField(fieldId).getAttribute("aria-invalid") === "true") {
    validateField(fieldId);
  }
}

/* ---------- Saved name and email ---------- */

function saveContactDetails() {
  const details = {
    fullName: getField("fullName").value,
    emailAddress: getField("emailAddress").value
  };
  if (details.fullName === "" && details.emailAddress === "") {
    removeSaved(STORAGE_KEYS.contact);
  } else {
    saveValue(STORAGE_KEYS.contact, details);
  }
}

/* Fill name and email from storage, but never over text already in the field */
function restoreContactDetails() {
  const saved = loadSaved(STORAGE_KEYS.contact, {});
  if (!saved || typeof saved !== "object") {
    return;
  }
  if (typeof saved.fullName === "string" && getField("fullName").value === "") {
    getField("fullName").value = saved.fullName.slice(0, 60);
  }
  if (typeof saved.emailAddress === "string" && getField("emailAddress").value === "") {
    getField("emailAddress").value = saved.emailAddress.slice(0, 254);
  }
}

function forgetContactDetails() {
  removeSaved(STORAGE_KEYS.contact);
  ["fullName", "emailAddress"].forEach(function (fieldId) {
    getField(fieldId).value = "";
    showFieldError(fieldId, "");
  });
  document.getElementById("savedNote").firstChild.textContent =
    "Saved details removed from this browser. ";
  getField("fullName").focus();
}

/* ---------- Pre-fill from the pre-order list ---------- */

function prefillFromList() {
  const list = loadPreorderList();
  if (list.length === 0) {
    return;
  }

  const requestType = getField("requestType");
  const itemDetails = getField("itemDetails");

  /* Only choose a request type if the visitor has not chosen one */
  if (requestType.value === "") {
    const onlyTheCake = list.length === 1 && list[0].id === "custom-cake";
    requestType.value = onlyTheCake ? "cake-order" : "pre-order";
  }

  /* Never overwrite text the visitor has typed */
  if (itemDetails.value.trim() === "") {
    const lines = list.map(function (item) {
      return "- " + item.name;
    });
    itemDetails.value = ("Pre-order list:\n" + lines.join("\n")).slice(0, 500);

    const note = document.createElement("span");
    note.id = "listNote";
    note.className = "form-note";
    note.textContent = "We filled this in from your pre-order list on the Bakery Products page. " +
      "You can change it.";
    getErrorElement("itemDetails").insertAdjacentElement("afterend", note);
  }
}

/* ---------- Building the extra page pieces ---------- */

/* Add an error element under every field and link it with aria-describedby */
function addErrorElements() {
  FIELD_IDS.forEach(function (fieldId) {
    const errorElement = document.createElement("span");
    errorElement.id = fieldId + "-error";
    errorElement.className = "field-error";
    errorElement.setAttribute("aria-live", "polite");

    const field = getField(fieldId);
    field.setAttribute("aria-describedby", errorElement.id);
    field.insertAdjacentElement("afterend", errorElement);
  });
}

/* A line under the contact fields with the "Forget my saved details" button */
function addSavedDetailsNote() {
  const paragraph = document.createElement("p");
  paragraph.id = "savedNote";
  paragraph.className = "saved-note";
  paragraph.setAttribute("aria-live", "polite");
  paragraph.appendChild(document.createTextNode(
    "We remember your name and email in this browser so you do not retype them. "));

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn-outline";
  button.textContent = "Forget my saved details";
  button.addEventListener("click", forgetContactDetails);
  paragraph.appendChild(button);

  getField("emailAddress").closest("fieldset").appendChild(paragraph);
}

/* The box shown after a valid submit. It starts hidden. */
function addConfirmationBox(form) {
  const box = document.createElement("div");
  box.id = "formConfirmation";
  box.className = "form-confirmation";
  box.setAttribute("role", "status");
  box.tabIndex = -1;
  box.hidden = true;
  form.insertAdjacentElement("beforebegin", box);
}

/* ---------- Submitting ---------- */

function showConfirmation(values) {
  const box = document.getElementById("formConfirmation");
  const needsDate = values.requestType === "pre-order" || values.requestType === "cake-order";

  let firstLine = "Thanks, " + values.fullName + ". Your ";
  if (needsDate) {
    const pickupDate = parseLocalDate(values.pickupDate);
    firstLine += (values.requestType === "cake-order" ? "custom cake request" : "pre-order request") +
      " for pickup on " + formatDate(pickupDate) + " passed every check.";
  } else {
    firstLine += "question passed every check.";
  }

  const demoLine = "This is a class demo site, so nothing was actually sent. " +
    "The bakery has not received your request and no email will arrive. " +
    "To place a real order, visit the bakery during opening hours.";

  const firstParagraph = document.createElement("p");
  firstParagraph.className = "confirmation-title";
  firstParagraph.textContent = firstLine;
  const secondParagraph = document.createElement("p");
  secondParagraph.textContent = demoLine;

  box.textContent = "";
  box.appendChild(firstParagraph);
  box.appendChild(secondParagraph);
  box.hidden = false;
  box.focus();
}

/* After a valid submit: empty the request fields and the saved list,
   but keep the visitor's name and email. */
function resetRequestFields() {
  REQUEST_FIELD_IDS.forEach(function (fieldId) {
    getField(fieldId).value = "";
    showFieldError(fieldId, "");
  });
  const listNote = document.getElementById("listNote");
  if (listNote) {
    listNote.remove();
  }
  clearPreorderList();
}

function handleSubmit(event) {
  /* The form has no server to post to, so always stop the real submit */
  event.preventDefault();
  document.getElementById("formConfirmation").hidden = true;

  const firstInvalidId = validateAllFields();
  if (firstInvalidId !== "") {
    getField(firstInvalidId).focus();
    return;
  }

  const values = getValues();
  resetRequestFields();
  showConfirmation(values);
}

/* ---------- Start up ---------- */

/* True while the pointer is held down on the submit button. Pressing the
   button blurs the field being edited; if that blur added an error message,
   the layout would shift, the button would move out from under the pointer,
   and the click would be lost. So blur checks are skipped during the press
   (the submit checks every field anyway). */
let isPressingSubmit = false;

function watchSubmitPress(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.addEventListener("pointerdown", function () {
    isPressingSubmit = true;
  });
  /* Listen on document: the pointer may be released away from the button */
  document.addEventListener("pointerup", function () {
    isPressingSubmit = false;
  });
  document.addEventListener("pointercancel", function () {
    isPressingSubmit = false;
  });
}

function initContactForm() {
  const form = document.querySelector("main form");
  if (!form) {
    return;
  }

  /* JS takes over checking; the HTML attributes still work if JS fails */
  form.setAttribute("novalidate", "");

  addErrorElements();
  addSavedDetailsNote();
  addConfirmationBox(form);
  restoreContactDetails();
  prefillFromList();

  FIELD_IDS.forEach(function (fieldId) {
    const field = getField(fieldId);
    field.addEventListener("blur", function () {
      if (!isPressingSubmit) {
        validateField(fieldId);
      }
    });
    field.addEventListener("input", function () {
      recheckIfInvalid(fieldId);
    });
  });

  /* The pickup rules depend on the request type, so re-check the date too */
  getField("requestType").addEventListener("change", function () {
    recheckIfInvalid("pickupDate");
  });

  /* Remember name and email as they are typed (allergy notes are never saved) */
  ["fullName", "emailAddress"].forEach(function (fieldId) {
    getField(fieldId).addEventListener("input", saveContactDetails);
  });

  watchSubmitPress(form);
  form.addEventListener("submit", handleSubmit);
}

initContactForm();

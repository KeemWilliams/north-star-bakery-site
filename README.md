# North Star Bakery

A static four-page website for North Star Bakery, a fictional neighborhood bakery that makes bread, pastries, and custom cakes by hand each morning. It is built for local families, commuters, and people placing cake or pre-orders, with a warm, homemade, trustworthy tone. This is a class project (Touchstone 3) that adds an external CSS design system and a responsive layout to semantic HTML.

Author: Wakeem Williams

## Pages

- `index.html`: home page with welcome audio, featured item, hours, and location
- `products.html`: breads, signature loaf, pastries and cookies, and cakes, with prices
- `about.html`: story, sourcing, staff, and a behind-the-scenes video
- `contact.html`: hours, location, and the pre-order and question form

## Design system

Colors:

- Cream `#FBF6EE`: page background and text on dark areas
- Espresso `#3B2A1E`: body text, header, and footer
- Crust `#A3471E`: links, headings rule, buttons, form field borders
- Honey `#E8C27A`: highlights on dark areas, card and fieldset borders

Fonts (Google Fonts):

- Lora for headings
- Source Sans 3 for body text, navigation, and forms

The layout is mobile-first: one column on phones, two columns from 48em, with larger type from 64em.

## Preview

In GitHub Codespaces the site opens automatically on port 8000. To preview locally, run this from the repository root and open http://localhost:8000:

```
python -m http.server 8000
```

## Folder structure

```
.
|-- index.html
|-- products.html
|-- about.html
|-- contact.html
|-- css/
|   `-- styles.css
|-- js/
|   |-- shared.js   browser storage helpers and the nav count
|   |-- products.js pre-order list and category filter
|   `-- contact.js  form validation, pre-fill and saved details
|-- images/        logo and photos (jpg, png)
|-- media/         welcome audio (mp3) and video (mp4)
|-- .devcontainer/ Codespaces setup
|-- .gitattributes
|-- .gitignore
`-- README.md
```

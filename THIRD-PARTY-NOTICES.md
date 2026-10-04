# Third-party notices

PDF Diva is free software, released under the [GNU General Public License v3.0 or later](LICENSE). It is built on the following projects. Thanks to all their authors.

## Included in the app

These are distributed with PDF Diva. Their full license texts must ship with every build of the app.

| Project | Used for | License | Copyright |
|---|---|---|---|
| [PDF.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) | Rendering PDF pages | Apache License 2.0 | Mozilla Foundation and PDF.js contributors |
| [OpenJPEG](https://www.openjpeg.org) (bundled with PDF.js) | Decoding JPEG 2000 images | BSD 2-Clause | Université catholique de Louvain and OpenJPEG contributors |
| JBIG2 decoder from [PDFium](https://pdfium.googlesource.com/pdfium/) (bundled with PDF.js) | Decoding JBIG2 images | BSD 3-Clause | The PDFium Authors |
| [qcms](https://github.com/FirefoxGraphics/qcms) (bundled with PDF.js) | Colour management | MIT | Mozilla Corporation; Marti Maria |
| Adobe CMaps (bundled with PDF.js) | Text in Chinese, Japanese and Korean PDFs | BSD 3-Clause | Adobe Systems Incorporated |
| Foxit fonts from PDFium (bundled with PDF.js) | Standard PDF fonts not embedded in the file | BSD 3-Clause | The PDFium Authors |
| [Liberation Sans](https://github.com/liberationfonts/liberation-fonts) (bundled with PDF.js) | Standard PDF fonts not embedded in the file | GPL-2.0 with font exception | Red Hat, Inc. |
| CGATS001Compat ICC profile (bundled with PDF.js) | CMYK colour conversion | CC0 1.0 | — |
| [Electron](https://www.electronjs.org) | Desktop app runtime | MIT | Electron contributors; GitHub Inc. |
| [Chromium](https://www.chromium.org) and [Node.js](https://nodejs.org) (bundled with Electron) | Browser engine and runtime | BSD-style, MIT and others | The Chromium Authors; Node.js contributors |
| [Phosphor Icons](https://phosphoricons.com) | Interface icons | MIT | Phosphor Icons |

License texts:

- PDF.js: `node_modules/pdfjs-dist/LICENSE`
- Components bundled with PDF.js: the `LICENSE*` files in `node_modules/pdfjs-dist/wasm`, `cmaps`, `standard_fonts` and `iccs`
- Electron: `node_modules/electron/LICENSE`
- Chromium and its dependencies: `LICENSES.chromium.html`, included by Electron in every build
- Phosphor Icons: [`resources/icons/LICENSE-phosphor.txt`](resources/icons/LICENSE-phosphor.txt)

## Used to build the app

These tools are used during development and are not distributed with the app.

| Project | Used for | License | Copyright |
|---|---|---|---|
| [TypeScript](https://www.typescriptlang.org) | Type checking | Apache License 2.0 | Microsoft Corporation |
| [esbuild](https://esbuild.github.io) | Bundling | MIT | Evan Wallace |
| [ESLint](https://eslint.org) | Linting | MIT | OpenJS Foundation and other contributors |
| [typescript-eslint](https://typescript-eslint.io) | TypeScript rules for ESLint | MIT | typescript-eslint and other contributors |

When a dependency is added or removed, update this file in the same change.

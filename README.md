# md2img

A small web app that converts Markdown to an image.

Demo: https://freddiefujiwara.com/md2img/

## How to use (very simple)

1. Open the app in your browser.
2. Paste or type Markdown.
3. The preview shows the result.
4. Export the preview as an image.

## Development (local)

1. Install Node.js (LTS is fine).
2. Install packages:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the URL that Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
```

The built files are in `dist/`.

## Preview the build

```bash
npm run preview
```

## Deploy (simple)

This project is a static site. Deploy the `dist/` folder to any static hosting.

Example steps:

1. Run `npm run build`.
2. Upload the `dist/` folder to your hosting service.
3. Set the site root to `dist/`.

If you use GitHub Pages or another static host, follow their normal upload steps and point it to `dist/`.

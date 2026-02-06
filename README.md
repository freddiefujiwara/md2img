# Markdown to Image tool for SNS posting (md2img)

A simple and powerful web application that converts Markdown text into high-quality images, perfectly optimized for sharing on social media platforms (SNS) like X (formerly Twitter), Instagram, and more.

Demo: [https://freddiefujiwara.com/md2img/](https://freddiefujiwara.com/md2img/)

## Key Features

- **Markdown Support**: Easily format your content using standard Markdown (Bold, Italic, Tables, Code blocks, etc.).
- **Auto-Pagination**: Long text is automatically split into multiple pages/images.
- **High Resolution**: Exports as high-resolution PNG images (Scale: 2) for crisp quality on all devices.
- **State Persistence**: Your Markdown content is saved in the URL, making it easy to share or bookmark.
- **Mobile Friendly**: Fully responsive design for creating images on the go.
- **Privacy Focused**: All conversion happens in your browser. No data is sent to a server.

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Markdown Parsing**: [marked](https://marked.js.org/)
- **Image Generation**: [html2canvas](https://html2canvas.hertzen.com/)
- **URL Compression**: [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html)

## How to use

1.  **Open the app**: Visit the demo link or run it locally.
2.  **Write Markdown**: Type or paste your content into the editor.
3.  **Preview**: See the real-time preview of how your images will look.
4.  **Export**: Click the download button to save your content as PNG images.

## Development (local)

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)

### Installation

\`\`\`bash
npm install
\`\`\`

### Running Dev Server

\`\`\`bash
npm run dev
\`\`\`

Open the URL that Vite prints (usually \`http://localhost:5173/md2img/\`).

### Running Tests

\`\`\`bash
npm run test
\`\`\`

## Build and Deploy

### Build

\`\`\`bash
npm run build
\`\`\`

The production-ready files will be in the \`dist/\` directory.

### Preview Build

\`\`\`bash
npm run preview
\`\`\`

### Deployment

This project is a static site. Deploy the \`dist/\` folder to any static hosting service (GitHub Pages, Vercel, Netlify, etc.).

For GitHub Pages, ensure your base path is correctly configured in \`vite.config.js\`.

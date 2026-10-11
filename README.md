# framo. — Elegant 4-Cut Photobooth Web Prototype

> **Turn Every Moment Into Frames.**

**FRAMO** is a web-based 4-cut photobooth experience inspired by Korean photo booths, editorial magazine layouts, and vintage analog photography. Built for a university entrepreneurship project, it combines intimate physical photobooth rituals with the instant accessibility of the browser.

---

## 📸 Key Features

- **Editorial 4-Cut Journey**: A guided 4-frame session with real-time 3-second countdowns, visual camera flash, and synthesizer shutter audio.
- **Webcam & Mobile Ready**: Direct browser webcam access via the native `navigator.mediaDevices.getUserMedia()` API with automatic front/back camera detection and video mirroring.
- **Graceful Fallbacks**: Intelligent permission handling and instant "Use Sample Photos" mode so you can test the entire workflow under any environment.
- **Live Frame Customization**: Six signature and graphic frames rendered directly onto a high-resolution Canvas:
  - **Classic Burgundy**: The signature FRAMO aesthetic with rich burgundy (`#781B28`), delicate cream borders, and gold accents.
  - **Car Free Day**: Urban morning run club aesthetic with pace counter (`05'24"`), km milestone markers, barcode, and volt-lime accents (`Car-Free-Day-Frame.png`).
  - **World Cup '26**: Official North America summer tournament celebration with the trophy, host nation flags, matchday badges, and soccer balls (`World-Cup-Frame.png`).
  - **Photo Memories**: Cute vintage Korean cafe photobooth aesthetic with postage stamps, ribbons, coffee cup doodles, and heart stickers (`Vintage-Green-Photobooth-Memories-Frame.png`).
  - **Sunday Morning**: A quiet, airy ivory mat with warm taupe typography and morning light sensibility.
  - **Film Memories**: Vintage 35mm analog emulsion border with sprocket marks and a glowing retro orange LED date stamp (`'26 10 11`).
- **Instant High-Res Export**: Single-click high-resolution PNG download (`framo-photobooth-[frame]-[date].png`).
- **Physical Print Layout**: Dedicated CSS `@media print` layout engineered for 4×6 photo paper and desktop photo printers via `window.print()`.

---

## 📁 Project Structure

```text
framo/
├── index.html       # Editorial landing page with hero strip mockup & 6-frame gallery
├── studio.html      # Interactive photobooth studio & capture canvas
├── style.css        # Custom brand styling, animations (flash, pulse), and print rules
├── script.js        # Camera engine, capture flow, canvas renderer & audio synthesis
├── assets/          # Frame overlays and sample portrait photos
│   ├── Car-Free-Day-Frame.png
│   ├── World-Cup-Frame.png
│   ├── Vintage-Green-Photobooth-Memories-Frame.png
│   ├── sample-1.jpg
│   ├── sample-2.jpg
│   ├── sample-3.jpg
│   └── sample-4.jpg
└── README.md        # Documentation and launch instructions
```

---

## 🚀 How to Run Locally

Because browser security policies require a secure origin (`http://localhost` or `https://`) for camera access (`getUserMedia`), open the project through a local web server:

### Option 1: VS Code Live Server (Recommended)

1. Open the `framo` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by *Ritwick Dey*) from the Extensions marketplace if you haven't already.
3. Right-click `index.html` in the file explorer.
4. Select **"Open with Live Server"** (or click **"Go Live"** in the bottom status bar).
5. Your browser will automatically open `http://127.0.0.1:5500/index.html`.

### Option 2: Python HTTP Server

If you have Python installed, run in your terminal:

```bash
# Python 3
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

### Option 3: Node.js / npx serve

```bash
npx serve . -l 3000
```
Then visit `http://localhost:3000`.

---

## 📱 Testing on Mobile Phones

To test the photobooth on your phone:
1. Ensure your mobile phone and computer are on the same Wi-Fi network.
2. Find your computer's local IP address (e.g., `192.168.1.X`).
3. Open `http://[YOUR-IP]:3000` or `http://[YOUR-IP]:5500` in Safari (iOS) or Chrome (Android).
4. Tap **Start Your Session** to take photos with your mobile phone camera!

---

## 🎨 Brand Identity & Palette

- **Burgundy**: `#781B28` — Primary brand color
- **Deep Burgundy**: `#54121D` — Emphasis & hover states
- **Warm Cream**: `#F8F3E9` — Primary background
- **Soft Ivory**: `#FFFDF8` — Content surfaces & card mat
- **Muted Gold**: `#C5A66A` — Subtle decorative accents & stars
- **Warm Brown**: `#3D2D28` — Editorial primary text
- **Muted Taupe**: `#947B65` — Secondary labels & captions

### Typography
- **Headlines & Wordmark**: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- **UI, Labels & Navigation**: [Outfit](https://fonts.google.com/specimen/Outfit)

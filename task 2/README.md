# Modern Calculator Web Application

A sleek, responsive, and fully functional Calculator Web Application inspired by Apple's minimalist aesthetic blended with modern SaaS glassmorphic design principles. Built using semantic **HTML5**, modern **CSS3**, and pure **Vanilla JavaScript** without external frameworks or dependencies.

![Calculator Preview](https://via.placeholder.com/800x450/0b0f19/60a5fa?text=Modern+Calculator+Web+App)

---

## ✨ Features

### 1. 🎨 Design & Aesthetics
- **Apple & SaaS-Inspired UI**: Frosted glassmorphism (`backdrop-filter: blur(24px)`), soft ambient glowing orbs, and smooth button press dynamics.
- **Curated Color Palette**: Deep navy (`#070b14`), charcoal (`#1e293b`), crisp white typography, and vibrant electric blue accents (`#2563eb`, `#60a5fa`).
- **Tactile Micro-Interactions**: Active press scaling, glowing operator highlights, smooth transitions, and keyboard-activated visual button presses.
- **Responsive Layout**: Pixel-perfect presentation across mobile phones, tablets, and desktop displays.
- **Dynamic Font Scaling**: Numbers automatically resize to avoid visual overflow when calculations produce long figures.

### 2. 🧮 Calculation Engine & Robust Logic
- **Safe Parsing Engine (Zero `eval()`)**: Implements Dijkstra’s **Shunting-Yard algorithm** and **Reverse Polish Notation (RPN)** evaluator for mathematically sound operator precedence (`×` and `÷` before `+` and `−`).
- **Floating-Point Precision Fix**: Automatically eliminates standard IEEE 754 float anomalies (e.g., `0.1 + 0.2` outputs clean `0.3` instead of `0.30000000000000004`).
- **Error Handling**: Graceful division-by-zero detection (`Cannot divide by 0`) and syntax protection against duplicate decimals or invalid operators.
- **Chained Calculations**: Smoothly evaluates continuous inputs (e.g., `12 + 8 × 2 = 28`).
- **Percentage & Sign Toggle**: Smart percentage calculations (e.g., tax/discount expressions or standalone percent) and instant plus/minus `±` negation.

### 3. 💾 Calculation History
- **Persistent Tape**: Stores recent calculations in browser `localStorage`.
- **Recall Capability**: Click or hit Enter on any historical record to instantly pull the result back onto the display.
- **Badge Counter & Management**: View total count of calculations and clear history with a single click.

### 4. 🌓 Theme Customization
- **Dark Mode**: High-contrast, deep navy neon aesthetics for low-light environments.
- **Light Mode**: Crisp, soft slate/porcelain frosted glass theme for daytime productivity.
- **Local Persistence**: Saves theme preference across browser sessions.

### 5. 📋 Clipboard Integration
- One-click copy button to copy the active calculation result to your clipboard with a confirmation toast notification.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` – `9` | Enter numbers |
| `.` | Decimal point (prevents duplicates) |
| `+`, `-`, `*`, `/` | Arithmetic operators (`*` or `x` for multiply, `/` for divide) |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last entered character |
| `Escape` | Clear all (`AC`) |
| `%` | Percentage operation |
| `C` | Copy active result to clipboard |
| `H` | Toggle calculation history drawer |

---

## 🚀 Getting Started

No build tools, bundlers, or package installations are required.

### 1. Clone or Download the Workspace
Ensure the following files are present in your folder:
```
task 2/
├── index.html       # Application markup and semantic layout
├── style.css        # CSS variables, glassmorphism, responsive design
├── script.js        # Calculator state, math engine, keyboard listener
└── README.md        # Documentation
```

### 2. Run Locally
You can run this project with any local HTTP server or simply open the file directly:

#### Option A: Python Built-in Server (Recommended)
```bash
# In the project directory:
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

#### Option B: VS Code Live Server
- Open the project folder in VS Code.
- Right-click `index.html` and click **"Open with Live Server"**.

#### Option C: Direct File Opening
Double-click `index.html` to open it directly in Chrome, Edge, Safari, or Firefox.

---

## 🛠️ Technology Stack
- **HTML5**: Semantic tags, ARIA attributes, SVG iconography.
- **CSS3**: Custom properties (CSS variables), Flexbox, CSS Grid, Glassmorphism, Keyframe animations.
- **Vanilla JavaScript (ES6+)**: Tokenizer, Shunting-Yard parser, DOM manipulation, Event delegation, Web Storage API (`localStorage`), Clipboard API.

---

## 📄 License
This project is open-source and free to use for personal or educational purposes.

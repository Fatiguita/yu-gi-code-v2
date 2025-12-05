# 🃏 Yu-Gi-Code! Card Creator

**Turn your code into a duel!**

Yu-Gi-Code! is an interactive application that transforms programming libraries and abstract concepts into **Yu-Gi-Oh! style trading cards**. Powered by the **Google Gemini API**, it generates unique lore, stats, and artwork for every function, making learning new libraries a magical experience.

## ✨ Features

-   **🔍 Library Summoning**: Search for any library (e.g., `React`, `TensorFlow`, `Lodash`) to generate a starter deck of iconic functions.
-   **🎨 AI-Generated Art**: Every card gets unique, mythologically-grounded artwork generated on the fly by Gemini.
-   **🧠 The Battlefield**: Test your knowledge! Select a card to enter the arena and face:
    -   **Strategy Trials**: Use-case quizzes.
    -   **Incantation Rituals**: Syntax fill-in-the-blank puzzles.
    -   **Code Duels**: Advanced implementation challenges against a timer.
-   **🃏 Deck Building**: Browse the "Armory" to select specific functions (Core, Staple, Situational) and build your perfect custom deck.
-   **🌌 Creative Mode**: Generate cards for *any* concept (e.g., "The Internet", "Coffee", "Imposter Syndrome") grounded in the app's four-region lore.
-   **📥 Export & Print**: Download your deck as high-res images or generate a printable PDF grid to play IRL.
-   **🖌️ Manual Art Mode**: Toggle this to upload your own images or use external tools to generate art based on the provided prompts.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **AI**: Google GenAI SDK (Gemini 2.5 Flash & Imagen)
-   **Utilities**: `html-to-image`, `jspdf`, `jszip`

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

-   **Node.js** (v18+ recommended)
-   **npm** or **yarn**
-   A **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Fatiguita/yu-gi-code-v2.git
    cd yu-gi-code-v2
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open the app**
    Click the link provided in the terminal (usually `http://localhost:5173`).

### Configuration

Once the app is running:
1.  Click the **Settings** icon (⚙️) in the top right corner.
2.  Enter your **Google Gemini API Key**.
3.  (Optional) Customize the UI theme and card style.

## 🎮 How to Play

1.  **Select a Mode**: Switch between **Code Mode** (libraries) and **Creative Mode** (concepts).
2.  **Summon a Deck**: Enter a topic (e.g., "React") and hit Generate.
3.  **Explore**: Click on cards to view their stats (`IMP` = Impact, `EZU` = Ease of Use) and lore.
4.  **Duel**: Click the "Challenge" button on a card to start a quiz or coding puzzle.
5.  **Build**: Use the function selector below the presentation deck to generate specific cards.

## 📄 License

This project is licensed under the MIT License.

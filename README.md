# BigQuery Release Notes Viewer & Twitter Publisher

Web application built with Python Flask and vanilla HTML/JS/CSS that fetches the latest Google Cloud BigQuery release notes from the official RSS feed, parses them, and allows sharing specific updates directly to X (Twitter).

## Features

*   **RSS Feed Parsing**: Automatically fetches and parses Google Cloud BigQuery release notes.
*   **Structured View**: Segregates release entries by date and highlights the type of update (Feature, Change, Deprecation, Issue) using color-coded cards.
*   **Search & Filters**: Search through updates instantly and filter by categories.
*   **Highlighting**: Search query matches are highlighted directly in the release cards.
*   **Tweet Generator**: Generates customized draft tweets based on the update in 3 different styles (*Tech Hype*, *Professional*, *Minimalist*) with visual loaders during generation.
*   **Character Limits Validation**: Disables post actions if the generated tweet exceeds the 280-character limit.
*   **Quick Share**: Direct integration with X (Twitter) Web Intent and copy-to-clipboard functionality.
*   **Copy Card Text**: Direct "Copy to Clipboard" button on each card for quick copying of the update details.
*   **CSV Export**: One-click download button in the header to export all parsed release notes into a `.csv` file.
*   **Light/Dark Theme Switcher**: Toggle switch in the header that overrides CSS variables and saves selection in `localStorage`.
*   **Mobile-Friendly Layout**: Optimized sidebar collapse and hamburger navigation menu for smartphones.
*   **UX skeleton loader**: Renders animated Skeleton Cards during feed fetching for better perceived performance.

## Tech Stack

*   **Backend**: Python, Flask, `feedparser`, `beautifulsoup4`
*   **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6)

## Quick Start

### Prerequisites

*   Python 3.x

### Installation & Run

1.  Clone the repository:
    ```bash
    git clone https://github.com/mastrophot/max-event-talks-app.git
    cd max-event-talks-app
    ```

2.  Create a virtual environment and install dependencies:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  Run the application:
    ```bash
    python app.py
    ```

4.  Open your browser and navigate to:
    `http://127.0.0.1:5001`

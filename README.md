# Firebase Studio

This is a Next.js starter project for an AI-powered legal assistant called LexEase, created in Firebase Studio.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/arpitdhote51/Lexease.git
    cd Lexease
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Set up your environment variables**
    The application uses Google's Generative AI. You'll need a Gemini API key for the AI features to work.

    *   Copy the example environment file:
        ```sh
        cp .env.example .env
        ```
    *   Open the newly created `.env` file and add your API key:
        ```
        GEMINI_API_KEY="YOUR_API_KEY_HERE"
        ```
    *   You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Development Server

Once the installation is complete, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Overview

For a detailed overview of the project architecture, features, and technology stack, please see the [**LexEase High-Level Technical Specification (hts.md)**](./hts.md).

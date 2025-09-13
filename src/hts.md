# LexEase Application Overview

This document provides a detailed overview of the LexEase application, including its architecture, the technologies used, its features, and key process flows.

## 1. Technologies Used

The application is built on a modern, robust tech stack designed for performance and scalability.

- **Frontend:**
  - **Next.js:** A React framework for building server-rendered and statically generated web applications.
  - **React & TypeScript:** For building a type-safe, component-based user interface.
  - **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
  - **ShadCN UI:** A collection of beautifully designed, accessible, and reusable UI components.

- **Backend & AI Integration:**
  - **Genkit:** An open-source framework from Google for building production-ready AI-powered applications.
  - **Google AI (Gemini Models):** The underlying Large Language Models (LLMs) used for all generative AI tasks, including summarization, entity recognition, Q&A, and drafting.
  - **Next.js Server Actions:** Used to securely call server-side AI flows from the client.

- **Storage & Database:**
  - **Google Cloud Storage (GCS):** Used to store and retrieve legal document templates for the drafting agent.
  - **Firebase Firestore:** Used to store user data and the history of Q&A conversations for each analyzed document.

- **Client-Side Libraries:**
  - **`pdfjs-dist`:** For parsing and extracting text from PDF files directly in the browser.
  - **`mammoth`:** For parsing and extracting text from DOCX files in the browser.
  - **`jspdf`:** For generating and downloading documents as PDF files on the client side.

---

## 2. Architecture Diagram

The application follows a client-server architecture where the Next.js frontend communicates with a Genkit-powered AI backend via Server Actions.

```
+----------------+      +-------------------------+      +--------------------+
|                |      |                         |      |                    |
| User's Browser |----->|  Next.js Frontend       |----->| Next.js Backend    |
| (React/Next.js)|      |  (React Components, UI) |      | (Server Actions)   |
|                |      |                         |      |                    |
+----------------+      +-------------------------+      +----------+---------+
                                                                    |
         +----------------------------------------------------------+
         |
         v
+--------+--------+      +-------------------------+      +--------------------+
|                 |      |                         |      |                    |
| Genkit AI Flows |----->| Google AI (Gemini)      |----->| Google Cloud       |
| (Server-side)   |      | (LLM for Analysis)      |      | Storage (Templates)|
|                 |      |                         |      |                    |
+-----------------+      +-------------------------+      +--------------------+
         |
         v
+--------+--------+
|                 |
| Firebase        |
| Firestore (Data)|
|                 |
+-----------------+

```
**Data Flow Explanation:**
1.  The user interacts with the UI in their browser. This includes uploading documents or asking questions to the Lexy AI assistant.
2.  Frontend components handle user input (e.g., file uploads, typing questions).
3.  Client-side libraries (`pdfjs`, `mammoth`) parse uploaded documents to extract text.
4.  When an AI-powered action is triggered (e.g., "Analyze Document" or "Ask Lexy"), a Next.js Server Action is called.
5.  The Server Action invokes the appropriate Genkit AI flow on the server (`interactiveQA`, `generalLegalQA`, etc.).
6.  The Genkit flow communicates with the Google AI (Gemini) model, sending it the document text and/or user query.
7.  The AI model processes the request and returns structured data (JSON).
8.  The AI flow sends the result back to the frontend, which updates the UI to display the analysis or chat response.

---

## 3. Wireframes / Mock Diagrams

This section describes the layout and structure of the main application screens.

### Homepage (`/`)
The landing page features a full-width, interactive chat interface for "Lexy," the AI legal assistant. Below this, it showcases the key capabilities of the platform. After the first user prompt, it redirects to a dedicated chat page.

### Dedicated Lexy Chat Page (`/lexy`)
A full-screen, immersive chat experience for interacting with Lexy on general legal matters, accessible via the main navigation and after the first prompt on the homepage.

### Document Analysis Screen (`/new`)
```
+-----------------------------------------------------------------------------+
| [Sidebar]          | [Main Content Area]                                    |
|--------------------|--------------------------------------------------------|
| - New Analysis     | [Document Input Card]        | [Analysis Results Card] |
| - New Draft        |                            |                         |
| - Consult Lawyer   | +------------------------+ | +---------------------+ |
| - ...              | | Drag & Drop File Upload| | | [Tabs: Summary]     | |
|                    | |                        | | |                     | |
|                    | | Select Role:           | | | Plain language      | |
|                    | | ( ) Layperson          | | | summary of the doc. | |
|                    | | ( ) Law Student        | | |                     | |
|                    | | ( ) Lawyer             | | |                     | |
|                    | |                        | | +---------------------+ |
|                    | | [Analyze Document] Btn | | | [Q&A Chat Window]   | |
|                    | +------------------------+ | +---------------------+ |
|                    |                            |                         |
+-----------------------------------------------------------------------------+
```

### Document Drafting Screen (`/draft`)
```
+-----------------------------------------------------------------------------+
| [Sidebar]          | [Main Content Area]                                    |
|--------------------|--------------------------------------------------------|
| - New Analysis     | [Drafting Inputs Card]       | [Generated Draft Card]  |
| - New Draft        |                            |                         |
| - ...              | +------------------------+ | +---------------------+ |
|                    | | Doc Type: [Select...]  | | | Your generated      | |
|                    | | Language: [Select...]  | | | draft will appear   | |
|                    | |                        | | | here...             | |
|                    | | Details: [Textarea...] | | |                     | |
|                    | |                        | | | [Download .txt] Btn | |
|                    | | [Generate Draft] Btn   | | | [Download .pdf] Btn | |
|                    | +------------------------+ | +---------------------+ |
|                    |                            |                         |
+-----------------------------------------------------------------------------+
```

---

## 4. Process Flow Diagrams

### Document Analysis Flow
```
(Start) -> [User lands on "New Analysis" page] -> [User uploads a document] -> [Client-side JS parses file] -> [User selects role] -> [User clicks "Analyze Document"] -> [Server Action calls AI flows] -> [Three flows run in parallel: Summary, Entities, Risks] -> [Results combined and sent to client] -> [UI updates with analysis] -> (End)
```

### General Legal Q&A (Lexy Chat) Flow
```
(Start) -> [User enters question on Homepage] -> [App redirects to /lexy with the question] -> [Server Action calls 'generalLegalQAFlow'] -> [AI model generates answer] -> [Answer sent to client] -> [UI updates with Lexy's response] -> (End)
```

---

## 5. List of Features

### Core Features
- **General Legal Q&A with "Lexy"**: An interactive AI legal assistant, trained on Indian law, available on the homepage and a dedicated chat page. Users can ask general legal questions and receive detailed, cited answers.
- **Document Upload & Parsing:** Users can upload legal documents in `.pdf`, `.docx`, and `.txt` formats. The app parses these files in the browser to extract text content.
- **AI-Powered Document Analysis:**
  - **Plain Language Summary:** Generates an easy-to-understand summary of complex legal text, tailored to the user's selected role (Layperson, Law Student, or Lawyer).
  - **Key Entity Recognition:** Automatically identifies and categorizes key entities such as parties, dates, locations, and monetary amounts.
  - **Risk Flagging:** Scans the document for potentially risky, unusual, or problematic clauses and highlights them for the user.
- **Interactive Q&A (Per Document):** A chat interface where users can ask specific questions about an already-analyzed document. The AI provides answers based on the document's content.
- **AI-Powered Document Drafting:**
  - Users can select a document type (e.g., Affidavit) and language.
  - By providing unstructured details, the AI drafts a formatted legal document.
- **Downloadable Drafts:** Generated drafts can be downloaded as both `.txt` and `.pdf` files.

### Supporting Features
- **Speech-to-Text & Text-to-Speech:**
  - **Speech-to-Text (STT):** The Lexy and Q&A chats include a "mic" button for voice input.
  - **Text-to-Speech (TTS):** AI-generated answers in the chats can be read aloud.
- **Static Content Pages:**
  - **Consult a Lawyer:** A page displaying a list of fictional lawyers for consultation booking.
  - **Learn Law:** A page with a gallery of educational legal videos.
  - **About & Contact:** Static pages providing information about the company and how to get in touch.
- **Client-Side Routing:** A responsive, single-page application experience powered by Next.js routing.
- **Responsive Design:** The UI is designed to be usable across different screen sizes.
```
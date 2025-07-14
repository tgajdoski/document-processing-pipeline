Document Processing Pipeline (LLM/MCP Concept)
This project is a prototype of a multi-stage document processing pipeline. It integrates Large Language Models (LLMs) via a Model Context Protocol (MCP) to demonstrate a flow from document upload to intelligent processing and decision-making.

Note: This implementation uses real Gemini LLM API calls for key processing steps.

Table of Contents
Project Overview

Key Technologies

Setup Instructions

Running the Application

Development Mode

Production Build & Run

How It Works (Conceptual Flow)

Important Notes & Limitations

Project Overview
This project showcases a conceptual document processing pipeline with the following features:

Document Upload: A web interface for uploading image files (JPEG, PNG, JPG).

Server-Side Text Extraction:

For images, text is extracted using Gemini's multimodal capabilities (gemini-2.0-flash).

LLM-Powered Tools (using Gemini API):

Structured Data Extraction: Gemini extracts structured data (e.g., invoice details) from the extracted text.

Document Type Recognition: Gemini classifies the document's type (e.g., "invoice", "contract").

Validation: Gemini validates the extracted data against type-specific rules.

Persistence Decision: Gemini decides if the document should be stored based on validation.

Model Context Protocol (MCP) Integration: A server-side intermediary routes requests to these LLM tools.

Persistence & Status Management: Includes a decision point for storage (actual storage not implemented).

Key Technologies
Node.js, Express.js, TypeScript: Core server-side and web application technologies.

Webpack: Bundles client-side TypeScript.

dotenv: Manages API keys securely.

multer: Handles file uploads.

Google Gemini API (gemini-2.0-flash): Powers text extraction from images, structured data extraction, document type recognition, validation, and persistence decisions.

Model Context Protocol (MCP): The communication protocol for LLM tools.

Setup Instructions
To run this project:

Clone the Repository:

git clone <your-repository-url>
cd document-processing-pipeline

Create .env File: In the project root, create .env with your Gemini API key:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

Important: Replace "YOUR_GEMINI_API_KEY_HERE" with your actual key. Do not commit this file!

Install Dependencies:

npm install

Running the Application
Development Mode
For active development with automatic recompilation and server restarts:

Start Development Server:

npm run dev

Access: Open http://localhost:3000 in your browser.

Production Build & Run
For a production-ready build or a single run:

Build Project:

npm run build

Start Server:

npm start

Access: Open http://localhost:3000 in your browser.

How It Works (Conceptual Flow)
Document Upload: User uploads an image file (JPEG, PNG, JPG) via the web interface. Client sends it to the server.

Server-Side Text & Data Extraction:

Server extracts raw text (using Gemini Vision for images).

Gemini then extracts structured data (e.g., invoice fields) from this raw text.

Server returns both raw text and structured data to the client.

Document Type Recognition: Client sends raw text to Gemini, which classifies the document type (e.g., "invoice").

Validation: Client sends structured data and document type to Gemini for validation against type-specific rules.

Persistence Decision: If valid, client sends data to Gemini, which decides if the document should be stored.

Client-Side Display: Web page updates with real-time processing results.

Persistence & Status Management: The pipeline concludes with a storage decision (actual storage not implemented).

Important Notes & Limitations
API Costs & Rate Limits: Gemini API usage incurs costs and is subject to rate limits.

Prompt Quality: LLM accuracy depends heavily on prompt design.

Error Handling: Prototype has basic error handling; a production system needs more robust solutions.

Security: API key is loaded securely on the server.

No Actual Persistence: Data is not saved to a database or file system.

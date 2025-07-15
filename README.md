# Document Processing Pipeline (LLM/MCP Concept)

This project is a prototype of a **multi-stage document processing pipeline**. It integrates **Large Language Models (LLMs)** via a **Model Context Protocol (MCP)** to demonstrate a flow from document upload to intelligent processing and decision-making.

> **Note:** This implementation uses real **Gemini LLM API** calls for key processing steps.

---

## Project Overview

This project showcases a conceptual document processing pipeline with the following features:

- **Document Upload**:  
  A web interface for uploading image files (JPEG, PNG, JPG).

- **Server-Side Text Extraction**:  
  For images, text is extracted using **Gemini's multimodal capabilities** (`gemini-2.0-flash`).

- **LLM-Powered Tools (using Gemini API)**:

  - **Structured Data Extraction**: Gemini extracts structured data (e.g., invoice details) from the extracted text.
  - **Document Type Recognition**: Gemini classifies the document's type (e.g., "invoice", "contract").
  - **Validation**: Gemini validates the extracted data against type-specific rules.
  - **Persistence Decision**: Gemini decides if the document should be stored based on validation.

- **Model Context Protocol (MCP) Integration**:  
  A server-side intermediary routes requests to these LLM tools.

- **Persistence & Status Management**:  
  Includes a decision point for storage (**actual storage not implemented**).

---

## Key Technologies

- **Node.js**, **Express.js**, **TypeScript**: Core server-side and web application technologies.
- **Webpack**: Bundles client-side TypeScript.
- **dotenv**: Manages API keys securely.
- **multer**: Handles file uploads.
- **Google Gemini API** (`gemini-2.0-flash`):  
  Powers:
  - Text extraction from images
  - Structured data extraction
  - Document type recognition
  - Validation
  - Persistence decisions
- **Model Context Protocol (MCP)**: The communication protocol for LLM tools.

---

## Setup Instructions

### 1. Clone the Repository

```
git clone <your-repository-url>
cd document-processing-pipeline
```

### 2. Create `.env` File

In the project root, create a `.env` file with your Gemini API key:

```
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

> **Important:** Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual key. **Do not commit this file!**

### 3. Install Dependencies

```
npm install
```

---

## Running the Application

### Development Mode

For active development with automatic recompilation and server restarts:

```
npm run dev
```

Access the app at:  
[http://localhost:3000](http://localhost:3000)

---

### Production Build & Run

For a production-ready build or a single run:

- **Build Project:**

```
npm run build
```

- **Start Server:**

```
npm start
```

Access the app at:  
[http://localhost:3000](http://localhost:3000)

---

## How It Works (Conceptual Flow)

1. **Document Upload**:  
   User uploads an image file (JPEG, PNG, JPG) via the web interface. The client sends it to the server.

2. **Server-Side Text & Data Extraction**:

   - Server extracts raw text (using **Gemini Vision** for images).
   - Gemini extracts structured data (e.g., invoice fields) from the raw text.
   - Server returns both raw text and structured data to the client.

3. **Document Type Recognition**:  
   Client sends raw text to Gemini, which classifies the document type (e.g., "invoice").

4. **Validation**:  
   Client sends structured data and document type to Gemini for validation against type-specific rules.

5. **Persistence Decision**:  
   If valid, client sends data to Gemini, which decides if the document should be stored.

6. **Client-Side Display**:  
   Web page updates with real-time processing results.

7. **Persistence & Status Management**:  
   The pipeline concludes with a storage decision (**actual storage not implemented**).

---

## Important Notes & Limitations

- **API Costs & Rate Limits**:  
  Gemini API usage incurs costs and is subject to rate limits.

- **Prompt Quality**:  
  LLM accuracy depends heavily on prompt design.

- **Error Handling**:  
  Prototype has basic error handling; a production system needs more robust solutions.

- **Security**:  
  API key is loaded securely on the server.

- **No Actual Persistence**:  
  Data is **not saved** to a database or file system.

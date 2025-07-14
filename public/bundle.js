/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
/*!******************************!*\
  !*** ./src/client/client.ts ***!
  \******************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
// --- MCP Client ---
class McpClient {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
    }
    async callTool(toolName, args, context) {
        const request = {
            tool_name: toolName,
            tool_args: args,
            context: context,
        };
        try {
            const response = await fetch(`${this.serverUrl}/mcp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`MCP call failed (${response.status}): ${errorData.error || errorData.message}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`MCP tool error: ${data.error}`);
            }
            return data.result;
        }
        catch (error) {
            console.error("Network or MCP communication error:", error);
            throw error;
        }
    }
}
// Helper function to classify document type from text
async function classifyDocumentFromText(text) {
    return await mcpClient.callTool('recognize_document_type', {
        text: text
    });
}
const mcpClient = new McpClient(window.location.origin); // Use current origin for server URL
document.getElementById('processButton')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('documentUpload');
    const outputDiv = document.getElementById('output');
    outputDiv.textContent = 'Processing...';
    if (!fileInput.files || fileInput.files.length === 0) {
        outputDiv.textContent = 'Please select a file first.';
        return;
    }
    const file = fileInput.files[0];
    // Check file type to ensure it's an image that Gemini can process
    if (!file.type.startsWith('image/')) {
        outputDiv.textContent = 'Please upload an image file (PNG, JPEG, JPG). PDF processing directly from client is not supported in this example.';
        return;
    }
    try {
        outputDiv.textContent = `Reading file: ${file.name}...`;
        const base64ImageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Ensure the base64 string starts after "data:image/png;base64," or similar prefix
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        // Step 1: First extract text to determine document type
        outputDiv.textContent += `\nExtracting text from image to identify document type...`;
        // Use Gemini to extract general text first
        const textExtractionResult = await mcpClient.callTool('extract_text_from_image', {
            base64Image: base64ImageData,
            mimeType: file.type
        });
        // Step 2: Use the recognize_document_type tool
        outputDiv.textContent += `\nRecognizing document type...`;
        const docType = await mcpClient.callTool('recognize_document_type', {
            text: textExtractionResult
        });
        outputDiv.textContent += `\nRecognized Document Type: ${docType}`;
        // Step 3: Based on document type, extract specific data
        let extractedData;
        if (docType === 'invoice') {
            outputDiv.textContent += `\nSending image to LLM for invoice data extraction...`;
            extractedData = await mcpClient.callTool('extract_invoice_data', {
                base64Image: base64ImageData,
                mimeType: file.type
            });
            outputDiv.textContent += `\nExtracted Invoice Data: ${JSON.stringify(extractedData, null, 2)}`;
        }
        else {
            // Handle other document types or provide generic extraction
            outputDiv.textContent += `\nDocument type '${docType}' - using generic text extraction`;
            extractedData = { text: textExtractionResult, documentType: docType };
        }
        outputDiv.textContent += '\nCalling LLM for document validation...';
        const validationResult = await mcpClient.callTool('validate_document', {
            metadata: extractedData, // Pass the actual extracted data
            document_type: docType
        });
        outputDiv.textContent += `\nValidation Result: ${JSON.stringify(validationResult)}`;
        if (validationResult.isValid) {
            outputDiv.textContent += '\nCalling LLM for persistence decision...';
            const persistenceDecision = await mcpClient.callTool('decide_persistence', {
                metadata: extractedData,
                validation_status: validationResult.isValid
            });
            outputDiv.textContent += `\nPersistence Decision: ${JSON.stringify(persistenceDecision)}`;
            if (persistenceDecision.shouldStore) {
                outputDiv.textContent += '\nDocument successfully processed and marked for storage. (Persistence logic not implemented in this prototype)';
                // In a real app, trigger actual storage here
            }
            else {
                outputDiv.textContent += '\nDocument validation failed or was decided not to be stored.';
            }
        }
        else {
            outputDiv.textContent += '\nDocument failed validation. Not proceeding with persistence.';
        }
    }
    catch (error) {
        outputDiv.textContent = `Error during processing: ${error instanceof Error ? error.message : String(error)}`;
        console.error('Full error:', error);
    }
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxlQUFlO0FBQzNEO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBLHVFQUF1RSw4QkFBOEI7QUFDckcsb0RBQW9ELGdCQUFnQixLQUFLLHFDQUFxQztBQUM5RztBQUNBO0FBQ0E7QUFDQSxtREFBbUQsV0FBVztBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLHlEQUF5RDtBQUN6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQsVUFBVTtBQUMzRDtBQUNBO0FBQ0E7QUFDQSx5RUFBeUU7QUFDekU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsZ0VBQWdFLFFBQVE7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2Isa0VBQWtFLHVDQUF1QztBQUN6RztBQUNBO0FBQ0E7QUFDQSx5REFBeUQsUUFBUTtBQUNqRSw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCx5REFBeUQsaUNBQWlDO0FBQzFGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsZ0VBQWdFLG9DQUFvQztBQUNwRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RCx1REFBdUQ7QUFDbkg7QUFDQTtBQUNBLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kb2N1bWVudC1wcm9jZXNzaW5nLXBpcGVsaW5lLy4vc3JjL2NsaWVudC9jbGllbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyAtLS0gTUNQIENsaWVudCAtLS1cbmNsYXNzIE1jcENsaWVudCB7XG4gICAgY29uc3RydWN0b3Ioc2VydmVyVXJsKSB7XG4gICAgICAgIHRoaXMuc2VydmVyVXJsID0gc2VydmVyVXJsO1xuICAgIH1cbiAgICBhc3luYyBjYWxsVG9vbCh0b29sTmFtZSwgYXJncywgY29udGV4dCkge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdG9vbF9uYW1lOiB0b29sTmFtZSxcbiAgICAgICAgICAgIHRvb2xfYXJnczogYXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuc2VydmVyVXJsfS9tY3BgLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvckRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCkuY2F0Y2goKCkgPT4gKHsgbWVzc2FnZTogcmVzcG9uc2Uuc3RhdHVzVGV4dCB9KSk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNQ1AgY2FsbCBmYWlsZWQgKCR7cmVzcG9uc2Uuc3RhdHVzfSk6ICR7ZXJyb3JEYXRhLmVycm9yIHx8IGVycm9yRGF0YS5tZXNzYWdlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIGlmIChkYXRhLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNQ1AgdG9vbCBlcnJvcjogJHtkYXRhLmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk5ldHdvcmsgb3IgTUNQIGNvbW11bmljYXRpb24gZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNsYXNzaWZ5IGRvY3VtZW50IHR5cGUgZnJvbSB0ZXh0XG5hc3luYyBmdW5jdGlvbiBjbGFzc2lmeURvY3VtZW50RnJvbVRleHQodGV4dCkge1xuICAgIHJldHVybiBhd2FpdCBtY3BDbGllbnQuY2FsbFRvb2woJ3JlY29nbml6ZV9kb2N1bWVudF90eXBlJywge1xuICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgfSk7XG59XG5jb25zdCBtY3BDbGllbnQgPSBuZXcgTWNwQ2xpZW50KHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pOyAvLyBVc2UgY3VycmVudCBvcmlnaW4gZm9yIHNlcnZlciBVUkxcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9jZXNzQnV0dG9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGZpbGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkb2N1bWVudFVwbG9hZCcpO1xuICAgIGNvbnN0IG91dHB1dERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRwdXQnKTtcbiAgICBvdXRwdXREaXYudGV4dENvbnRlbnQgPSAnUHJvY2Vzc2luZy4uLic7XG4gICAgaWYgKCFmaWxlSW5wdXQuZmlsZXMgfHwgZmlsZUlucHV0LmZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBvdXRwdXREaXYudGV4dENvbnRlbnQgPSAnUGxlYXNlIHNlbGVjdCBhIGZpbGUgZmlyc3QuJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBmaWxlID0gZmlsZUlucHV0LmZpbGVzWzBdO1xuICAgIC8vIENoZWNrIGZpbGUgdHlwZSB0byBlbnN1cmUgaXQncyBhbiBpbWFnZSB0aGF0IEdlbWluaSBjYW4gcHJvY2Vzc1xuICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgIG91dHB1dERpdi50ZXh0Q29udGVudCA9ICdQbGVhc2UgdXBsb2FkIGFuIGltYWdlIGZpbGUgKFBORywgSlBFRywgSlBHKS4gUERGIHByb2Nlc3NpbmcgZGlyZWN0bHkgZnJvbSBjbGllbnQgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGV4YW1wbGUuJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBvdXRwdXREaXYudGV4dENvbnRlbnQgPSBgUmVhZGluZyBmaWxlOiAke2ZpbGUubmFtZX0uLi5gO1xuICAgICAgICBjb25zdCBiYXNlNjRJbWFnZURhdGEgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIGJhc2U2NCBzdHJpbmcgc3RhcnRzIGFmdGVyIFwiZGF0YTppbWFnZS9wbmc7YmFzZTY0LFwiIG9yIHNpbWlsYXIgcHJlZml4XG4gICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0U3RyaW5nID0gcmVhZGVyLnJlc3VsdC5zcGxpdCgnLCcpWzFdO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoYmFzZTY0U3RyaW5nKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIub25lcnJvciA9IHJlamVjdDtcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gU3RlcCAxOiBGaXJzdCBleHRyYWN0IHRleHQgdG8gZGV0ZXJtaW5lIGRvY3VtZW50IHR5cGVcbiAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9IGBcXG5FeHRyYWN0aW5nIHRleHQgZnJvbSBpbWFnZSB0byBpZGVudGlmeSBkb2N1bWVudCB0eXBlLi4uYDtcbiAgICAgICAgLy8gVXNlIEdlbWluaSB0byBleHRyYWN0IGdlbmVyYWwgdGV4dCBmaXJzdFxuICAgICAgICBjb25zdCB0ZXh0RXh0cmFjdGlvblJlc3VsdCA9IGF3YWl0IG1jcENsaWVudC5jYWxsVG9vbCgnZXh0cmFjdF90ZXh0X2Zyb21faW1hZ2UnLCB7XG4gICAgICAgICAgICBiYXNlNjRJbWFnZTogYmFzZTY0SW1hZ2VEYXRhLFxuICAgICAgICAgICAgbWltZVR5cGU6IGZpbGUudHlwZVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gU3RlcCAyOiBVc2UgdGhlIHJlY29nbml6ZV9kb2N1bWVudF90eXBlIHRvb2xcbiAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9IGBcXG5SZWNvZ25pemluZyBkb2N1bWVudCB0eXBlLi4uYDtcbiAgICAgICAgY29uc3QgZG9jVHlwZSA9IGF3YWl0IG1jcENsaWVudC5jYWxsVG9vbCgncmVjb2duaXplX2RvY3VtZW50X3R5cGUnLCB7XG4gICAgICAgICAgICB0ZXh0OiB0ZXh0RXh0cmFjdGlvblJlc3VsdFxuICAgICAgICB9KTtcbiAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9IGBcXG5SZWNvZ25pemVkIERvY3VtZW50IFR5cGU6ICR7ZG9jVHlwZX1gO1xuICAgICAgICAvLyBTdGVwIDM6IEJhc2VkIG9uIGRvY3VtZW50IHR5cGUsIGV4dHJhY3Qgc3BlY2lmaWMgZGF0YVxuICAgICAgICBsZXQgZXh0cmFjdGVkRGF0YTtcbiAgICAgICAgaWYgKGRvY1R5cGUgPT09ICdpbnZvaWNlJykge1xuICAgICAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9IGBcXG5TZW5kaW5nIGltYWdlIHRvIExMTSBmb3IgaW52b2ljZSBkYXRhIGV4dHJhY3Rpb24uLi5gO1xuICAgICAgICAgICAgZXh0cmFjdGVkRGF0YSA9IGF3YWl0IG1jcENsaWVudC5jYWxsVG9vbCgnZXh0cmFjdF9pbnZvaWNlX2RhdGEnLCB7XG4gICAgICAgICAgICAgICAgYmFzZTY0SW1hZ2U6IGJhc2U2NEltYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogZmlsZS50eXBlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG91dHB1dERpdi50ZXh0Q29udGVudCArPSBgXFxuRXh0cmFjdGVkIEludm9pY2UgRGF0YTogJHtKU09OLnN0cmluZ2lmeShleHRyYWN0ZWREYXRhLCBudWxsLCAyKX1gO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gSGFuZGxlIG90aGVyIGRvY3VtZW50IHR5cGVzIG9yIHByb3ZpZGUgZ2VuZXJpYyBleHRyYWN0aW9uXG4gICAgICAgICAgICBvdXRwdXREaXYudGV4dENvbnRlbnQgKz0gYFxcbkRvY3VtZW50IHR5cGUgJyR7ZG9jVHlwZX0nIC0gdXNpbmcgZ2VuZXJpYyB0ZXh0IGV4dHJhY3Rpb25gO1xuICAgICAgICAgICAgZXh0cmFjdGVkRGF0YSA9IHsgdGV4dDogdGV4dEV4dHJhY3Rpb25SZXN1bHQsIGRvY3VtZW50VHlwZTogZG9jVHlwZSB9O1xuICAgICAgICB9XG4gICAgICAgIG91dHB1dERpdi50ZXh0Q29udGVudCArPSAnXFxuQ2FsbGluZyBMTE0gZm9yIGRvY3VtZW50IHZhbGlkYXRpb24uLi4nO1xuICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gYXdhaXQgbWNwQ2xpZW50LmNhbGxUb29sKCd2YWxpZGF0ZV9kb2N1bWVudCcsIHtcbiAgICAgICAgICAgIG1ldGFkYXRhOiBleHRyYWN0ZWREYXRhLCAvLyBQYXNzIHRoZSBhY3R1YWwgZXh0cmFjdGVkIGRhdGFcbiAgICAgICAgICAgIGRvY3VtZW50X3R5cGU6IGRvY1R5cGVcbiAgICAgICAgfSk7XG4gICAgICAgIG91dHB1dERpdi50ZXh0Q29udGVudCArPSBgXFxuVmFsaWRhdGlvbiBSZXN1bHQ6ICR7SlNPTi5zdHJpbmdpZnkodmFsaWRhdGlvblJlc3VsdCl9YDtcbiAgICAgICAgaWYgKHZhbGlkYXRpb25SZXN1bHQuaXNWYWxpZCkge1xuICAgICAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9ICdcXG5DYWxsaW5nIExMTSBmb3IgcGVyc2lzdGVuY2UgZGVjaXNpb24uLi4nO1xuICAgICAgICAgICAgY29uc3QgcGVyc2lzdGVuY2VEZWNpc2lvbiA9IGF3YWl0IG1jcENsaWVudC5jYWxsVG9vbCgnZGVjaWRlX3BlcnNpc3RlbmNlJywge1xuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBleHRyYWN0ZWREYXRhLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25fc3RhdHVzOiB2YWxpZGF0aW9uUmVzdWx0LmlzVmFsaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9IGBcXG5QZXJzaXN0ZW5jZSBEZWNpc2lvbjogJHtKU09OLnN0cmluZ2lmeShwZXJzaXN0ZW5jZURlY2lzaW9uKX1gO1xuICAgICAgICAgICAgaWYgKHBlcnNpc3RlbmNlRGVjaXNpb24uc2hvdWxkU3RvcmUpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXREaXYudGV4dENvbnRlbnQgKz0gJ1xcbkRvY3VtZW50IHN1Y2Nlc3NmdWxseSBwcm9jZXNzZWQgYW5kIG1hcmtlZCBmb3Igc3RvcmFnZS4gKFBlcnNpc3RlbmNlIGxvZ2ljIG5vdCBpbXBsZW1lbnRlZCBpbiB0aGlzIHByb3RvdHlwZSknO1xuICAgICAgICAgICAgICAgIC8vIEluIGEgcmVhbCBhcHAsIHRyaWdnZXIgYWN0dWFsIHN0b3JhZ2UgaGVyZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0RGl2LnRleHRDb250ZW50ICs9ICdcXG5Eb2N1bWVudCB2YWxpZGF0aW9uIGZhaWxlZCBvciB3YXMgZGVjaWRlZCBub3QgdG8gYmUgc3RvcmVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXREaXYudGV4dENvbnRlbnQgKz0gJ1xcbkRvY3VtZW50IGZhaWxlZCB2YWxpZGF0aW9uLiBOb3QgcHJvY2VlZGluZyB3aXRoIHBlcnNpc3RlbmNlLic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIG91dHB1dERpdi50ZXh0Q29udGVudCA9IGBFcnJvciBkdXJpbmcgcHJvY2Vzc2luZzogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YDtcbiAgICAgICAgY29uc29sZS5lcnJvcignRnVsbCBlcnJvcjonLCBlcnJvcik7XG4gICAgfVxufSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
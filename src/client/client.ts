import { OCRResult } from '../shared/types';

// --- MCP Client ---
class McpClient {
    private serverUrl: string;

    constructor(serverUrl: string) {
        this.serverUrl = serverUrl;
    }

    async callTool(toolName: string, args: any, context?: any): Promise<any> {
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
        } catch (error) {
            console.error("Network or MCP communication error:", error);
            throw error;
        }
    }
}

// Helper function to classify document type from text
async function classifyDocumentFromText(text: string): Promise<string> {
    return await mcpClient.callTool('recognize_document_type', {
        text: text
    });
}

const mcpClient = new McpClient(window.location.origin); // Use current origin for server URL

document.getElementById('processButton')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('documentUpload') as HTMLInputElement;
    const outputDiv = document.getElementById('output') as HTMLPreElement;
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
        const base64ImageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Ensure the base64 string starts after "data:image/png;base64," or similar prefix
                const base64String = (reader.result as string).split(',')[1];
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
        } else {
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
            } else {
                outputDiv.textContent += '\nDocument validation failed or was decided not to be stored.';
            }
        } else {
            outputDiv.textContent += '\nDocument failed validation. Not proceeding with persistence.';
        }

    } catch (error) {
        outputDiv.textContent = `Error during processing: ${error instanceof Error ? error.message : String(error)}`;
        console.error('Full error:', error);
    }
});

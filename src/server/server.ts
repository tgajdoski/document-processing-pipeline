import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import { McpRequest, McpResponse } from '../shared/types';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '10mb' })); 

app.use(express.static(path.join(__dirname, '../../public')));

// Get Gemini API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in the .env file. Please set it to use the Gemini API.');
    process.exit(1);
}

// Use gemini-2.0-flash for multimodal capabilities (text + image)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Helper function to call the Gemini API, now supporting image input
async function callGeminiAPI(prompt: string, schema?: any, base64ImageData?: string, mimeType?: string): Promise<any> {
    const parts: any[] = [{ text: prompt }];

    if (base64ImageData && mimeType) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64ImageData
            }
        });
    }

    const payload: any = { contents: [{ role: "user", parts: parts }] };

    if (schema) {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: schema
        };
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            if (schema) {
                try {
                    return JSON.parse(text);
                } catch (jsonError) {
                    console.error('Failed to parse Gemini JSON response:', text, jsonError);
                    throw new Error('Invalid JSON response from Gemini API.');
                }
            }
            return text; // Raw text response
        } else {
            console.warn('Gemini API response structure unexpected:', JSON.stringify(result, null, 2));
            throw new Error('Unexpected response structure from Gemini API.');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

// LLM Tool: Extract text from image (general purpose)
async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
    console.log(`[MCP Server] Calling Gemini to extract text from image...`);

    const prompt = `Extract all visible text from this image. Return only the extracted text without any additional formatting or commentary.`;

    const extractedText = await callGeminiAPI(prompt, undefined, base64Image, mimeType);
    return typeof extractedText === 'string' ? extractedText : '';
}

// LLM Tool: Recognize Document Type from Text
async function recognizeDocumentType(text: string): Promise<string> {
  console.log(`[MCP Server] Calling Gemini to recognize document type...`);

  const prompt = `Given the following document text, classify its type. Possible types include: "invoice", "receipt", "contract", "report", "letter", "other".
  
  Document Text:
  ${text}
  
  Respond with only the document type as a single word.`;

  const response = await callGeminiAPI(prompt);
  // Ensure the response is a string and trim it
  return typeof response === 'string' ? response.trim().toLowerCase() : 'other';
}

// LLM Tool: Extract Invoice Data from Image
async function extractInvoiceDataFromImage(base64Image: string, mimeType: string): Promise<any> {
    console.log(`[MCP Server] Calling Gemini to extract invoice data from image...`);

    const invoiceSchema = {
        type: "OBJECT",
        properties: {
            invoiceNumber: { type: "STRING", description: "The unique invoice number" },
            vendorName: { type: "STRING", description: "The name of the company issuing the invoice" },
            invoiceDate: { type: "STRING", description: "The date of the invoice in YYYY-MM-DD format" },
            totalAmount: { type: "NUMBER", description: "The total amount due, including tax" },
            currency: { type: "STRING", description: "The currency of the total amount (e.g., USD, EUR)" },
            items: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        description: { type: "STRING" },
                        quantity: { type: "NUMBER" },
                        unitPrice: { type: "NUMBER" },
                        lineTotal: { type: "NUMBER" }
                    },
                    required: ["description", "quantity", "unitPrice", "lineTotal"]
                },
                description: "List of line items on the invoice"
            }
        },
        required: ["invoiceNumber", "vendorName", "invoiceDate", "totalAmount", "currency"]
    };

    const prompt = `Extract the following structured data from this invoice image. If a field is not found, omit it.
    
    ${JSON.stringify(invoiceSchema, null, 2)}
    
    Respond in JSON format according to the provided schema.`;

    const extractedData = await callGeminiAPI(prompt, invoiceSchema, base64Image, mimeType);
    return extractedData;
}

// LLM Tool: Document Validation (enhanced with business logic)
async function validateDocument(metadata: any, docType: string): Promise<{ isValid: boolean, issues?: string[] }> {
    console.log(`[MCP Server] Validating document with business rules...`);

    const issues: string[] = [];
    let isValid = true;

    // First, do programmatic validation based on document type
    if (docType === 'invoice') {
        // Check required fields
        if (!metadata.invoiceNumber || typeof metadata.invoiceNumber !== 'string' || metadata.invoiceNumber.trim() === '') {
            issues.push('Invoice number is missing or invalid');
            isValid = false;
        }

        if (!metadata.vendorName || typeof metadata.vendorName !== 'string' || metadata.vendorName.trim() === '') {
            issues.push('Vendor name is missing or invalid');
            isValid = false;
        }

        if (!metadata.invoiceDate) {
            issues.push('Invoice date is missing');
            isValid = false;
        } else {
            // Validate date format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(metadata.invoiceDate)) {
                issues.push('Invoice date format is invalid (expected YYYY-MM-DD)');
                isValid = false;
            } else {
                // Check if date is reasonable (not in future, not too old)
                const invoiceDate = new Date(metadata.invoiceDate);
                const today = new Date();
                const twoYearsAgo = new Date();
                twoYearsAgo.setFullYear(today.getFullYear() - 2);

                if (invoiceDate > today) {
                    issues.push('Invoice date cannot be in the future');
                    isValid = false;
                }
                if (invoiceDate < twoYearsAgo) {
                    issues.push('Invoice date is suspiciously old (more than 2 years ago)');
                    // Not marking as invalid, just a warning
                }
            }
        }

        if (typeof metadata.totalAmount !== 'number' || metadata.totalAmount <= 0) {
            issues.push('Total amount must be a positive number');
            isValid = false;
        } else if (metadata.totalAmount > 1000000) {
            issues.push('Total amount seems unusually high (over $1M)');
            // Not marking as invalid, just a warning
        }

        if (!metadata.currency || typeof metadata.currency !== 'string') {
            issues.push('Currency is missing or invalid');
            isValid = false;
        } else {
            // Check if currency is a valid 3-letter code
            const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR'];
            if (!validCurrencies.includes(metadata.currency.toUpperCase())) {
                issues.push(`Currency "${metadata.currency}" is not in the list of supported currencies`);
                // Not marking as invalid, just a warning
            }
        }

        // Validate items array if present
        if (metadata.items && Array.isArray(metadata.items)) {
            let calculatedTotal = 0;
            metadata.items.forEach((item: any, index: number) => {
                if (!item.description || typeof item.description !== 'string') {
                    issues.push(`Item ${index + 1}: Description is missing or invalid`);
                    isValid = false;
                }
                if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                    issues.push(`Item ${index + 1}: Quantity must be a positive number`);
                    isValid = false;
                }
                if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
                    issues.push(`Item ${index + 1}: Unit price must be a non-negative number`);
                    isValid = false;
                }
                if (typeof item.lineTotal !== 'number' || item.lineTotal < 0) {
                    issues.push(`Item ${index + 1}: Line total must be a non-negative number`);
                    isValid = false;
                }

                // Check if line total matches quantity * unit price (with small tolerance for rounding)
                if (typeof item.quantity === 'number' && typeof item.unitPrice === 'number' && typeof item.lineTotal === 'number') {
                    const expectedTotal = item.quantity * item.unitPrice;
                    const tolerance = 0.01; // 1 cent tolerance
                    if (Math.abs(expectedTotal - item.lineTotal) > tolerance) {
                        issues.push(`Item ${index + 1}: Line total (${item.lineTotal}) doesn't match quantity × unit price (${expectedTotal})`);
                        isValid = false;
                    }
                    calculatedTotal += item.lineTotal;
                }
            });

            // Check if items total matches invoice total (with tolerance for taxes/fees)
            if (metadata.items.length > 0 && calculatedTotal > 0) {
                const tolerance = metadata.totalAmount * 0.2; // 20% tolerance for taxes, fees, etc.
                if (Math.abs(calculatedTotal - metadata.totalAmount) > tolerance) {
                    issues.push(`Sum of line items (${calculatedTotal.toFixed(2)}) differs significantly from total amount (${metadata.totalAmount})`);
                    // Not marking as invalid since taxes/fees might account for difference
                }
            }
        }
    } else {
        // For other document types, do basic validation
        if (!metadata || Object.keys(metadata).length === 0) {
            issues.push('No metadata extracted from document');
            isValid = false;
        }
    }

    // If basic validation passed and there are no critical issues, also use LLM for additional validation
    if (isValid && issues.length === 0) {
        try {
            const validationSchema = {
                type: "OBJECT",
                properties: {
                    additionalIssues: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    },
                    hasRedFlags: { type: "BOOLEAN" }
                },
                required: ["additionalIssues", "hasRedFlags"]
            };

            const prompt = `You are an expert document validator. Analyze this ${docType} data for any suspicious patterns, inconsistencies, or red flags that might indicate fraud or errors.
            
            Extracted Metadata: ${JSON.stringify(metadata, null, 2)}
            
            Look for:
            - Suspicious vendor names or patterns
            - Unusual amounts or pricing
            - Inconsistent formatting
            - Missing expected fields for this document type
            - Any other red flags
            
            Respond in JSON format with any additional issues found and whether there are red flags.`;

            const llmValidation = await callGeminiAPI(prompt, validationSchema);
            
            if (llmValidation.additionalIssues && llmValidation.additionalIssues.length > 0) {
                issues.push(...llmValidation.additionalIssues);
            }
            
            if (llmValidation.hasRedFlags) {
                issues.push('LLM detected potential red flags in the document');
                // Don't automatically mark as invalid, but flag for review
            }
        } catch (llmError) {
            console.warn('LLM validation failed, proceeding with programmatic validation only:', llmError);
        }
    }

    return { isValid, issues };
}

// LLM Tool: Persistence Decision
async function decidePersistence(metadata: any, validationStatus: boolean): Promise<{ shouldStore: boolean }> {
    console.log(`[MCP Server] Calling Gemini for persistence decision...`);

    const decisionSchema = {
        type: "OBJECT",
        properties: {
            shouldStore: { type: "BOOLEAN" }
        },
        required: ["shouldStore"]
    };

    const prompt = `Based on the following information, decide if a document should be stored.
    
    Document Metadata: ${JSON.stringify(metadata, null, 2)}
    Validation Status: ${validationStatus ? 'Valid' : 'Invalid'}
    
    If the validation status is 'Valid', the document should generally be stored. If 'Invalid', it should not.
    
    Respond in JSON format according to the following schema:
    ${JSON.stringify(decisionSchema, null, 2)}
    `;

    const response = await callGeminiAPI(prompt, decisionSchema);
    return response;
}

// MCP API endpoint
app.post('/mcp', async (req, res) => {
    const { tool_name, tool_args, context }: McpRequest = req.body;
    let result: any;
    let error: string | undefined;

    try {
        switch (tool_name) {
            case 'extract_text_from_image': // NEW TOOL for general text extraction
                if (typeof tool_args.base64Image !== 'string' || typeof tool_args.mimeType !== 'string') {
                    throw new Error('Missing or invalid "base64Image" or "mimeType" arguments for extract_text_from_image.');
                }
                result = await extractTextFromImage(tool_args.base64Image, tool_args.mimeType);
                break;
            case 'extract_invoice_data': // NEW TOOL
                if (typeof tool_args.base64Image !== 'string' || typeof tool_args.mimeType !== 'string') {
                    throw new Error('Missing or invalid "base64Image" or "mimeType" arguments for extract_invoice_data.');
                }
                result = await extractInvoiceDataFromImage(tool_args.base64Image, tool_args.mimeType);
                break;
            case 'recognize_document_type': 
                // For now, we'll keep it, but it might just return 'invoice' based on the extraction
                if (typeof tool_args.text !== 'string') {
                    // If text isn't provided, we can't classify it.
                    // This path might be less used if 'extract_invoice_data' is primary.
                    throw new Error('Missing or invalid "text" argument for recognize_document_type.');
                }
                // If you still want a general text-based classification, uncomment/adapt this:
                 result = await recognizeDocumentType(tool_args.text);
                // For this specific flow, we'll assume 'extract_invoice_data' implies 'invoice'
                //result = 'invoice'; // Or you can remove this tool entirely if always extracting invoice data
                break;
            case 'validate_document':
                if (typeof tool_args.metadata !== 'object' || typeof tool_args.document_type !== 'string') {
                    throw new Error('Missing or invalid "metadata" or "document_type" arguments for validate_document.');
                }
                result = await validateDocument(tool_args.metadata, tool_args.document_type);
                break;
            case 'decide_persistence':
                if (typeof tool_args.metadata !== 'object' || typeof tool_args.validation_status !== 'boolean') {
                    throw new Error('Missing or invalid "metadata" or "validation_status" arguments for decide_persistence.');
                }
                result = await decidePersistence(tool_args.metadata, tool_args.validation_status);
                break;
            case 'test_validation': // TEST TOOL to demonstrate validation
                const testData = tool_args.testData || {
                    invoiceNumber: "INV-001",
                    vendorName: "Test Vendor",
                    invoiceDate: "2025-07-14",
                    totalAmount: 100.50,
                    currency: "USD",
                    items: [
                        {
                            description: "Test Item",
                            quantity: 2,
                            unitPrice: 50.25,
                            lineTotal: 100.50
                        }
                    ]
                };
                result = await validateDocument(testData, 'invoice');
                break;
            default:
                error = `Unknown tool: ${tool_name}`;
        }
    } catch (e: any) {
        console.error(`Error processing tool '${tool_name}':`, e);
        error = e.message || 'An unexpected error occurred.';
    }

    if (error) {
        res.status(500).json({ error } as McpResponse);
    } else {
        res.json({ result } as McpResponse);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
    if (!GEMINI_API_KEY) {
        console.warn('WARNING: GEMINI_API_KEY is not set. LLM features will not work.');
    }
});


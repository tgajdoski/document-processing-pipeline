// For OCR Simulation from the document
export type OCRResult = {
    text: string;
    confidence: number;
    language: string;
};

// Basic MCP Request structure (can be expanded)
export interface McpRequest {
    tool_name: string;
    tool_args: any;
    context?: any;
}

// Basic MCP Response structure (can be expanded)
export interface McpResponse {
    result?: any;
    error?: string;
}
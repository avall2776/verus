"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfLoader = void 0;
const pdfParseModule = require('pdf-parse');
const pdfParseFn = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule?.default || pdfParseModule);
class PdfLoader {
    static async extractText(fileBuffer) {
        const data = await pdfParseFn(fileBuffer);
        return data?.text || '';
    }
}
exports.PdfLoader = PdfLoader;
//# sourceMappingURL=pdf.loader.js.map
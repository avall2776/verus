"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfLoader = void 0;
const pdf_parse_1 = require("pdf-parse");
class PdfLoader {
    static async extractText(fileBuffer) {
        const data = await (0, pdf_parse_1.default)(fileBuffer);
        return data.text;
    }
}
exports.PdfLoader = PdfLoader;
//# sourceMappingURL=pdf.loader.js.map
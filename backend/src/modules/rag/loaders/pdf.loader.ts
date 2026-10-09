// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseModule = require('pdf-parse');
const pdfParseFn: (dataBuffer: Buffer) => Promise<{ text: string }> =
  typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule?.default || pdfParseModule);

export class PdfLoader {
  static async extractText(fileBuffer: Buffer): Promise<string> {
    const data = await pdfParseFn(fileBuffer);
    return data?.text || '';
  }
}


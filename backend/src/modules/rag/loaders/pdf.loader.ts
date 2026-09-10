import pdfParse from 'pdf-parse';

export class PdfLoader {
  static async extractText(fileBuffer: Buffer): Promise<string> {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }
}

import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { textChunker, NewChunk } from './textChunker';

export interface PdfProcessResult {
  text: string;
  chunks: NewChunk[];
}
interface PdfParseResult {
  text: string;
}

/**
 * Extract text from PDF file
 * @param filePath - Path to PDF file
 * @returns The extracted text content as a string
 */
const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = await fs.readFile(filePath);

    const parse = pdfParse as unknown as (
      buffer: Buffer,
    ) => Promise<PdfParseResult>;
    const data = await parse(dataBuffer);

    return data.text;
  } catch (error) {
    console.log('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

const parseAndChunkPDF = async (
  filePath: string,
): Promise<PdfProcessResult> => {
  const text = await extractTextFromPDF(filePath);

  const chunks = textChunker.chunkText(text, 500, 50);

  return { text, chunks };
};

export const PDFHelpers = { extractTextFromPDF, parseAndChunkPDF };

import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DriveService {
  private readonly welcomeFileName = 'Welcome_to_CiveHub_Drive.pdf';
  
  // Minimal valid PDF structure for "Welcome to CiveHub Drive"
  private readonly welcomePdfBuffer = Buffer.from(
    '%PDF-1.1\n' +
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n' +
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n' +
    '5 0 obj << /Length 110 >> stream\n' +
    'BT\n' +
    '/F1 24 Tf\n' +
    '100 700 Td\n' +
    '(Welcome to CiveHub Drive) Tj\n' +
    '0 -40 Td\n' +
    '/F1 14 Tf\n' +
    '(Your secure workplace for all team files.) Tj\n' +
    'ET\n' +
    'endstream\n' +
    'endobj\n' +
    'xref\n' +
    '0 6\n' +
    '0000000000 65535 f\n' +
    '0000000009 00000 n\n' +
    '0000000056 00000 n\n' +
    '0000000111 00000 n\n' +
    '0000000212 00000 n\n' +
    '0000000289 00000 n\n' +
    'trailer << /Size 6 /Root 1 0 R >>\n' +
    'startxref\n' +
    '449\n' +
    '%%EOF'
  );

  async findAll(tenantId: string, userId: string) {
    // In a real app, this would fetch from a database (e.g. Postgres)
    // For now, we return a hardcoded list for EVERY tenant
    return [
      {
        id: 'welcome-file-id',
        name: this.welcomeFileName,
        size: this.welcomePdfBuffer.length,
        type: 'application/pdf',
        updatedAt: new Date().toISOString(),
        owner: 'System',
      },
      {
        id: 'proj-doc-id',
        name: 'Project_Roadmap_Q3.docx',
        size: 45000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        updatedAt: new Date().toISOString(),
        owner: 'Admin',
      }
    ];
  }

  async getFileBuffer(tenantId: string, fileId: string): Promise<{ buffer: Buffer; name: string }> {
    if (fileId === 'welcome-file-id') {
      return { buffer: this.welcomePdfBuffer, name: this.welcomeFileName };
    }
    throw new NotFoundException('File not found');
  }
}

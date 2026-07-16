import { HttpClient } from '@angular/common/http';

function buildDocumentPathUrl(baseUrl: string, relativePath: string): string {
  const segments = relativePath.split('/').filter(Boolean);
  if (segments.length < 2) {
    segments.unshift('uploads');
  }

  const filename = segments.pop()!;
  const filepath = segments.join('/');

  return `${baseUrl}/document/downloadDocumentsFromFileName/${encodeURIComponent(filepath)}/${encodeURIComponent(filename)}`;
}

async function fetchAuthenticatedBlob(http: HttpClient, url: string): Promise<Blob> {
  const blob = await http.get(url, { responseType: 'blob' }).toPromise();

  if (!blob) {
    throw new Error('Download returned empty response');
  }

  if (blob.type === 'application/json') {
    const errorText = await blob.text();
    throw new Error(errorText || 'Failed to download file');
  }

  return blob;
}

async function openBlobInNewTab(blob: Blob): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, '_blank');
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Failed to open file. Please allow pop-ups for this site.');
  }

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function openAuthenticatedUrl(
  http: HttpClient,
  url: string,
): Promise<void> {
  const blob = await fetchAuthenticatedBlob(http, url);
  await openBlobInNewTab(blob);
}

export async function openAuthenticatedReport(
  http: HttpClient,
  baseUrl: string,
  reportId: number,
  state = 'inline',
): Promise<void> {
  const url = `${baseUrl}/report/downloadReport/${encodeURIComponent(state)}/${encodeURIComponent(String(reportId))}`;
  await openAuthenticatedUrl(http, url);
}

export async function openAuthenticatedDocumentByPath(
  http: HttpClient,
  baseUrl: string,
  relativePath: string,
): Promise<void> {
  await openAuthenticatedUrl(http, buildDocumentPathUrl(baseUrl, relativePath));
}

export async function openAuthenticatedUploadedFile(
  http: HttpClient,
  baseUrl: string,
  fileName: string,
): Promise<void> {
  await openAuthenticatedDocumentByPath(http, baseUrl, `uploads/${fileName}`);
}

export async function openAuthenticatedDocumentById(
  http: HttpClient,
  baseUrl: string,
  documentId: number,
  state = 'attachment',
): Promise<void> {
  const url = `${baseUrl}/document/downloadDocument/${encodeURIComponent(state)}/${encodeURIComponent(String(documentId))}`;
  await openAuthenticatedUrl(http, url);
}

export async function downloadAuthenticatedDocumentByPath(
  http: HttpClient,
  baseUrl: string,
  relativePath: string,
  downloadName?: string,
): Promise<void> {
  const blob = await fetchAuthenticatedBlob(http, buildDocumentPathUrl(baseUrl, relativePath));
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = downloadName ?? relativePath.split('/').pop() ?? 'download';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

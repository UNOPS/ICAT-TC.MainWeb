import { HttpClient } from '@angular/common/http';

export async function openAuthenticatedReport(
  http: HttpClient,
  baseUrl: string,
  reportId: number,
  state = 'inline',
): Promise<void> {
  const url = `${baseUrl}/report/downloadReport/${encodeURIComponent(state)}/${encodeURIComponent(String(reportId))}`;
  const blob = await http.get(url, { responseType: 'blob' }).toPromise();

  if (!blob) {
    throw new Error('Report download returned empty response');
  }

  if (blob.type === 'application/json') {
    const errorText = await blob.text();
    throw new Error(errorText || 'Failed to download report');
  }

  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, '_blank');
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Failed to open report. Please allow pop-ups for this site.');
  }

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

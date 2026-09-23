import { proxyToApi } from '@/lib/admin/proxy';

export async function POST(request: Request) {
  return proxyToApi(request, '/content/case-studies', 'POST');
}

import { proxyToApi } from '@/lib/admin/proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return proxyToApi(request, `/admin/settings/${key}`, 'PATCH');
}

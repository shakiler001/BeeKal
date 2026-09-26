import { proxyToApi } from '@/lib/admin/proxy';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToApi(request, `/users/${id}/reinvite`, 'POST');
}

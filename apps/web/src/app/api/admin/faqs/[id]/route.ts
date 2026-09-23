import { proxyToApi } from '@/lib/admin/proxy';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToApi(request, `/content/faqs/${id}`, 'PATCH');
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToApi(request, `/content/faqs/${id}`, 'DELETE');
}

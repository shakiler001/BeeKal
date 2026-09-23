import { proxyToApi } from '@/lib/admin/proxy';

/** Publishing carries its own permission, so it gets its own route. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToApi(request, `/content/problems/${id}/status`, 'PATCH');
}

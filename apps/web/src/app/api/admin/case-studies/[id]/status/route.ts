import { proxyToApi } from '@/lib/admin/proxy';

/**
 * Publishing is a separate route because it carries a separate permission.
 * Someone who may write a case study is not automatically someone who may put
 * it on the website.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToApi(request, `/content/case-studies/${id}/status`, 'PATCH');
}

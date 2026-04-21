// /app/api/kipris/pdf/route.js
// KIPRIS PDF 프록시 — CORS 우회 + PDF 전문 서빙

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Only allow KIPRIS URLs
  if (!pdfUrl.includes('kipris.or.kr') && !pdfUrl.includes('kipi.or.kr')) {
    return new Response('Invalid URL domain', { status: 403 });
  }

  try {
    const res = await fetch(pdfUrl);
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    return new Response('PDF fetch failed', { status: 502 });
  }
}

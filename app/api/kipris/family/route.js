// /app/api/kipris/family/route.js
// KIPRIS 특허 패밀리 조회 프록시

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const applicationNumber = searchParams.get('applicationNumber');

  const apiKey = process.env.KIPRIS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'KIPRIS API key not configured' }, { status: 500 });
  }

  if (!applicationNumber) {
    return Response.json({ error: 'applicationNumber is required' }, { status: 400 });
  }

  try {
    // 특허 패밀리 REST API
    const url = `http://plus.kipris.or.kr/openapi/rest/patFamilyInfoSearchService/getFamilyInfoSearch?accessKey=${encodeURIComponent(apiKey)}&applicationNumber=${applicationNumber}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/xml' },
    });
    const xmlText = await res.text();

    return new Response(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('KIPRIS family API error:', error);
    return Response.json({ error: 'KIPRIS API request failed', detail: error.message }, { status: 502 });
  }
}

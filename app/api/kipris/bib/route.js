// /app/api/kipris/bib/route.js
// KIPRIS 특허·실용 공개·등록공보 서지정보 조회 프록시
// 브라우저 CORS 차단을 우회하기 위한 서버사이드 프록시

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const applicationNumber = searchParams.get('applicationNumber');
  const openNumber = searchParams.get('openNumber');
  const registerNumber = searchParams.get('registerNumber');
  const keyword = searchParams.get('keyword');

  const apiKey = process.env.KIPRIS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'KIPRIS API key not configured' }, { status: 500 });
  }

  try {
    // Build KIPRIS Plus API URL
    // 특허·실용 공개·등록공보 REST API
    const baseUrl = 'http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice';
    let url;

    if (applicationNumber || openNumber || registerNumber) {
      // 서지정보 조회 (번호 기반)
      url = `${baseUrl}/getBibliographyDetailInfoSearch?accessKey=${encodeURIComponent(apiKey)}`;
      if (applicationNumber) url += `&applicationNumber=${applicationNumber}`;
      if (openNumber) url += `&openNumber=${openNumber}`;
      if (registerNumber) url += `&registerNumber=${registerNumber}`;
    } else if (keyword) {
      // 키워드 검색
      url = `${baseUrl}/getWordSearch?accessKey=${encodeURIComponent(apiKey)}&word=${encodeURIComponent(keyword)}&numOfRows=10&pageNo=1`;
    } else {
      return Response.json({ error: 'No search parameter provided' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'Accept': 'application/xml' },
    });
    const xmlText = await res.text();

    return new Response(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('KIPRIS bib API error:', error);
    return Response.json({ error: 'KIPRIS API request failed', detail: error.message }, { status: 502 });
  }
}

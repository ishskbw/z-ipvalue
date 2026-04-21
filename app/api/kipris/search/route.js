// /app/api/kipris/search/route.js
// KIPRIS 통합 검색 → Claude SMK 생성 올인원 엔드포인트
// 번호 입력 시: KIPRIS 서지 + 패밀리 조회 → Claude SMK 생성까지 서버에서 처리

export async function POST(request) {
  const body = await request.json();
  const { patentNo, searchType = 'application' } = body;

  const kiprisKey = process.env.KIPRIS_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!kiprisKey) return Response.json({ error: 'KIPRIS API key not configured' }, { status: 500 });

  const cleanNo = patentNo.replace(/[^0-9]/g, '');
  const result = { bib: null, family: [], smk: null, error: null };

  try {
    // ── Step 1: KIPRIS 서지정보 조회 ──
    const paramName = searchType === 'application' ? 'applicationNumber'
      : searchType === 'publication' ? 'openNumber' : 'registerNumber';
    
    const bibUrl = `http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/getBibliographyDetailInfoSearch?accessKey=${encodeURIComponent(kiprisKey)}&${paramName}=${cleanNo}`;
    
    const bibRes = await fetch(bibUrl);
    const bibXml = await bibRes.text();
    
    // Parse XML server-side
    const extract = (xml, tag) => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1].trim() : null;
    };
    const extractAll = (xml, tag) => {
      const matches = [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'))];
      return matches.map(m => m[1].trim());
    };

    result.bib = {
      title: extract(bibXml, 'inventionTitle') || extract(bibXml, 'inventionTitleKorean') || extract(bibXml, 'title') || '',
      applicationNumber: extract(bibXml, 'applicationNumber') || cleanNo,
      applicationDate: extract(bibXml, 'applicationDate') || '',
      inventorName: extract(bibXml, 'inventorName') || extractAll(bibXml, 'inventorName').join(', ') || '',
      applicantName: extract(bibXml, 'applicantName') || extractAll(bibXml, 'applicantName').join(', ') || '',
      abstract: extract(bibXml, 'astrtCont') || extract(bibXml, 'abstract') || '',
      ipcNumber: extract(bibXml, 'ipcNumber') || '',
      registerStatus: extract(bibXml, 'registerStatus') || extract(bibXml, 'registrationStatus') || '',
      registerNumber: extract(bibXml, 'registerNumber') || '',
      registerDate: extract(bibXml, 'registerDate') || '',
      openNumber: extract(bibXml, 'openNumber') || '',
      openDate: extract(bibXml, 'openDate') || '',
      bigDrawing: extract(bibXml, 'bigDrawing') || extract(bibXml, 'drawing') || '',
      rawXml: bibXml.substring(0, 3000), // For debugging (first 3000 chars)
    };

    // ── Step 2: KIPRIS 패밀리 조회 ──
    const appNo = result.bib.applicationNumber || cleanNo;
    try {
      const famUrl = `http://plus.kipris.or.kr/openapi/rest/patFamilyInfoSearchService/getFamilyInfoSearch?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNo}`;
      const famRes = await fetch(famUrl);
      const famXml = await famRes.text();
      
      // Extract family countries
      const countryMatches = [...famXml.matchAll(/<familyCountryCode>([^<]*)<\/familyCountryCode>/g)];
      const countryNames = [...famXml.matchAll(/<familyCountryName>([^<]*)<\/familyCountryName>/g)];
      const familyAppNos = [...famXml.matchAll(/<familyApplicationNumber>([^<]*)<\/familyApplicationNumber>/g)];
      
      const seen = new Set();
      for (let i = 0; i < countryMatches.length; i++) {
        const code = countryMatches[i][1].trim();
        if (code && code !== 'KR' && !seen.has(code)) {
          seen.add(code);
          result.family.push({
            countryCode: code,
            countryName: countryNames[i] ? countryNames[i][1].trim() : '',
            applicationNo: familyAppNos[i] ? familyAppNos[i][1].trim() : '',
          });
        }
      }
    } catch (e) {
      console.warn('Family search error:', e);
    }

    // ── Step 3: Claude SMK 생성 ──
    if (anthropicKey && result.bib.title) {
      try {
        const prompt = `다음 특허 정보를 바탕으로 SMK(기술이전 마케팅 시트)를 작성해주세요.

[특허 정보]
- 발명의 명칭: ${result.bib.title}
- 출원번호: ${result.bib.applicationNumber}
- 출원일: ${result.bib.applicationDate}
- 발명자: ${result.bib.inventorName}
- 출원인: ${result.bib.applicantName}
- IPC: ${result.bib.ipcNumber}
- 초록: ${result.bib.abstract}

반드시 아래 JSON 형식으로만 응답하세요.
{"field":"기술 분야","trl":숫자(1-9),"summary":"기술 개요 (2-3문장)","core":"핵심 기술 내용 (3-4문장)","advantage":"특징 및 장점","application":"활용 분야","effect":"기대 효과","keywords":["키워드1","키워드2","키워드3","키워드4","키워드5"]}`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const claudeData = await claudeRes.json();
        const text = claudeData.content?.map(i => i.text || '').join('\n') || '';
        const clean = text.replace(/```json|```/g, '').trim();
        result.smk = JSON.parse(clean);
      } catch (e) {
        console.error('Claude SMK error:', e);
        result.smk = null;
      }
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Search failed', detail: error.message }, { status: 502 });
  }
}

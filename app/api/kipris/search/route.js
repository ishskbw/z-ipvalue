// /app/api/kipris/search/route.js
// KIPRIS Plus REST API — 정확한 엔드포인트 사용

export async function POST(request) {
  const body = await request.json();
  const { patentNo, searchType = 'application' } = body;

  const kiprisKey = process.env.KIPRIS_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!kiprisKey) return Response.json({ error: 'KIPRIS API key not configured' }, { status: 500 });

  const cleanNo = patentNo.replace(/[^0-9]/g, '');
  const result = { bib: null, family: [], smk: null, error: null };

  const ext = (xml, tag) => {
    const re = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([\\s\\S]*?)</${tag}>`);
    const m = xml.match(re);
    return m ? (m[1] || m[2] || '').trim() : '';
  };

  const base = 'http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice';

  try {
    // ── Step 1: 항목별검색 (출원/공개/등록 번호) ──
    let url;
    if (searchType === 'application') {
      url = `${base}/applicationNumberSearchInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${cleanNo}&patent=true&utility=true&docsCount=1&docsStart=1`;
    } else if (searchType === 'publication') {
      url = `${base}/openNumberSearchInfo?accessKey=${encodeURIComponent(kiprisKey)}&openNumber=${cleanNo}&patent=true&utility=true&docsCount=1&docsStart=1`;
    } else {
      url = `${base}/registrationNumberSearchInfo?accessKey=${encodeURIComponent(kiprisKey)}&registrationNumber=${cleanNo}&patent=true&utility=true&docsCount=1&docsStart=1`;
    }

    const r1 = await fetch(url);
    const xml1 = await r1.text();

    const total = ext(xml1, 'TotalSearchCount');
    if (!total || total === '0') {
      result.bib = { title: '검색 결과 없음', applicationNumber: cleanNo, rawXml: xml1.substring(0, 2000) };
      return Response.json(result);
    }

    const appNum = ext(xml1, 'ApplicationNumber') || cleanNo;
    result.bib = {
      title: ext(xml1, 'InventionName'),
      applicationNumber: appNum,
      applicationDate: ext(xml1, 'ApplicationDate'),
      applicantName: ext(xml1, 'Applicant'),
      inventorName: '',
      abstract: ext(xml1, 'Abstract'),
      ipcNumber: ext(xml1, 'InternationalpatentclassificationNumber'),
      registerStatus: ext(xml1, 'RegistrationStatus'),
      registerNumber: ext(xml1, 'RegistrationNumber'),
      registerDate: ext(xml1, 'RegistrationDate'),
      openNumber: ext(xml1, 'OpeningNumber'),
      openDate: ext(xml1, 'OpeningDate'),
      bigDrawing: ext(xml1, 'DrawingPath') || ext(xml1, 'ThumbnailPath'),
      rawXml: xml1.substring(0, 3000),
    };

    // ── Step 2: 초록 상세 ──
    if (!result.bib.abstract) {
      try {
        const r = await fetch(`${base}/patentAbstractInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
        const x = await r.text();
        const a = ext(x, 'astrtCont');
        if (a) result.bib.abstract = a;
      } catch(e) {}
    }

    // ── Step 3: 대표도면 ──
    if (!result.bib.bigDrawing) {
      try {
        const r = await fetch(`${base}/getReprsntFloorPlanInfoSearch?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
        const x = await r.text();
        result.bib.bigDrawing = ext(x, 'largePath') || ext(x, 'path');
      } catch(e) {}
    }

    // ── Step 4: 패밀리 ──
    try {
      const r = await fetch(`${base}/patentFamilyInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
      const x = await r.text();
      const codes = [...x.matchAll(/<countryCode>([\s\S]*?)<\/countryCode>/g)];
      const names = [...x.matchAll(/<countryName>([\s\S]*?)<\/countryName>/g)];
      const nums = [...x.matchAll(/<familyNumber>([\s\S]*?)<\/familyNumber>/g)];
      const seen = new Set();
      for (let i = 0; i < codes.length; i++) {
        const c = codes[i][1].trim();
        if (c && c !== 'KR' && !seen.has(c)) {
          seen.add(c);
          result.family.push({ countryCode: c, countryName: names[i]?.[1]?.trim() || '', applicationNo: nums[i]?.[1]?.trim() || '' });
        }
      }
    } catch(e) {}

    // ── Step 5: Claude SMK ──
    if (anthropicKey && result.bib.title && result.bib.title !== '검색 결과 없음') {
      try {
        const prompt = `다음 특허 정보를 바탕으로 SMK를 작성하세요. JSON만 응답하세요.
[특허] ${result.bib.title}
[출원번호] ${result.bib.applicationNumber}
[출원일] ${result.bib.applicationDate}
[출원인] ${result.bib.applicantName}
[IPC] ${result.bib.ipcNumber}
[초록] ${result.bib.abstract}
{"field":"기술분야","trl":숫자,"summary":"개요","core":"핵심기술","advantage":"장점","application":"활용분야","effect":"효과","keywords":["kw1","kw2","kw3","kw4","kw5"]}`;

        const cr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
        });
        const cd = await cr.json();
        const t = (cd.content?.map(i => i.text || '').join('\n') || '').replace(/```json|```/g, '').trim();
        result.smk = JSON.parse(t);
      } catch(e) { console.error('Claude error:', e); }
    }

    return Response.json(result);
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Search failed', detail: error.message }, { status: 502 });
  }
}

// /app/api/kipris/search/route.js
// KIPRIS Plus REST API + Claude SMK

export async function POST(request) {
  const body = await request.json();
  const { patentNo, searchType = 'application' } = body;

  const kiprisKey = process.env.KIPRIS_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!kiprisKey) return Response.json({ error: 'KIPRIS API key not configured' }, { status: 500 });

  const cleanNo = patentNo.replace(/[^0-9]/g, '');
  const result = { bib: null, family: [], smk: null, error: null, pdfUrls: {}, debug: {} };

  const ext = (xml, tag) => {
    const re = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([\\s\\S]*?)</${tag}>`);
    const m = xml.match(re);
    return m ? (m[1] || m[2] || '').trim() : '';
  };
  const extAll = (xml, tag) => {
    return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map(m => m[1].trim()).filter(Boolean);
  };

  const base = 'http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice';

  try {
    // ── Step 1: 항목별검색 ──
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

    // ── Step 3: 발명자 (InventorName 태그) ──
    try {
      const r = await fetch(`${base}/patentInventorInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
      const x = await r.text();
      const names = extAll(x, 'InventorName');
      if (names.length > 0) result.bib.inventorName = names.join(', ');
    } catch(e) {}

    // ── Step 4: 대표도면 ──
    if (!result.bib.bigDrawing) {
      try {
        const r = await fetch(`${base}/getReprsntFloorPlanInfoSearch?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
        const x = await r.text();
        result.bib.bigDrawing = ext(x, 'largePath') || ext(x, 'path');
      } catch(e) {}
    }

    // ── Step 5: 패밀리 ──
    try {
      const r = await fetch(`${base}/patentFamilyInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
      const x = await r.text();
      const codes = extAll(x, 'countryCode');
      const cnames = extAll(x, 'countryName');
      const nums = extAll(x, 'familyNumber');
      const seen = new Set();
      for (let i = 0; i < codes.length; i++) {
        if (codes[i] && codes[i] !== 'KR' && !seen.has(codes[i])) {
          seen.add(codes[i]);
          result.family.push({ countryCode: codes[i], countryName: cnames[i] || '', applicationNo: nums[i] || '' });
        }
      }
    } catch(e) {}

    // ── Step 6: 전문 PDF URL (patentFullTextFileInfo) ──
    try {
      const r = await fetch(`${base}/patentFullTextFileInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
      const x = await r.text();
      result.debug.pdfFileInfo = x.substring(0, 800);
      const paths = extAll(x, 'path');
      const docNames = extAll(x, 'docName');
      for (let i = 0; i < paths.length; i++) {
        const name = (docNames[i] || '').toLowerCase();
        if (name.includes('공고') || name.includes('등록') || name.includes('ann')) {
          result.pdfUrls.ann = paths[i];
        } else if (name.includes('공개') || name.includes('pub')) {
          result.pdfUrls.pub = paths[i];
        } else if (!result.pdfUrls.main) {
          result.pdfUrls.main = paths[i];
        }
      }
      // If no specific match, use first available
      if (!result.pdfUrls.ann && !result.pdfUrls.pub && paths.length > 0) {
        result.pdfUrls.main = paths[0];
      }
    } catch(e) { result.debug.pdfErr = String(e); }

    // Fallback: try patentFullTextCheckInfo to see what's available
    if (!result.pdfUrls.ann && !result.pdfUrls.pub && !result.pdfUrls.main) {
      try {
        const r = await fetch(`${base}/patentFullTextCheckInfo?accessKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${appNum}`);
        const x = await r.text();
        result.debug.pdfCheck = x.substring(0, 500);
      } catch(e) {}
    }

    // ── Step 7: Claude SMK + 도면 설명 ──
    if (anthropicKey && result.bib.title && result.bib.title !== '검색 결과 없음') {
      try {
        const prompt = `다음 특허 정보를 바탕으로 SMK(기술이전 마케팅 시트)를 작성하세요.
초록에서 도면 번호(도 1, 도 2 등)가 언급되면, 각 도면의 설명도 작성하세요.

[특허] ${result.bib.title}
[출원번호] ${result.bib.applicationNumber}
[출원일] ${result.bib.applicationDate}
[출원인] ${result.bib.applicantName}
[발명자] ${result.bib.inventorName}
[IPC] ${result.bib.ipcNumber}
[초록] ${result.bib.abstract}

JSON만 응답하세요:
{"field":"기술 분야","trl":숫자(1-9),"summary":"기술 개요 2-3문장","core":"핵심 기술 내용 3-4문장","advantage":"특징 및 장점","application":"활용 분야","effect":"기대 효과","keywords":["키워드1","키워드2","키워드3","키워드4","키워드5"],"figureDescs":[{"no":"도 1","title":"도면 제목","desc":"도면 설명"}]}`;

        const cr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
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

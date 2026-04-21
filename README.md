# Z-IPValue — 제니스특허법률사무소 IP 기술이전 플랫폼

**도메인**: z-ipvalue.com  
**기술 스택**: Next.js 14 + Vercel + KIPRIS API + Claude API

---

## 배포 가이드 (z-ipvalue.com → Vercel)

### 1단계: GitHub 저장소 생성

```bash
# 이 폴더를 GitHub에 올리기
cd z-ipvalue
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/z-ipvalue.git
git push -u origin main
```

### 2단계: Vercel 배포

1. [vercel.com](https://vercel.com) 에 GitHub 계정으로 로그인
2. "Add New Project" → GitHub 저장소 `z-ipvalue` 선택
3. Framework: **Next.js** (자동 감지됨)
4. **Environment Variables** 설정 (중요!):

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `KIPRIS_API_KEY` | `BG96VgMxpZup1YGp5NQ...` | KIPRIS Plus REST AccessKey |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API 키 |
| `NEXT_PUBLIC_SITE_URL` | `https://z-ipvalue.com` | 사이트 URL |
| `NEXT_PUBLIC_FIRM_EMAIL` | `info@ipzenith.co.kr` | 문의 수신 이메일 |

5. "Deploy" 클릭 → 배포 완료

### 3단계: 도메인 연결 (z-ipvalue.com)

1. Vercel 프로젝트 → Settings → Domains
2. `z-ipvalue.com` 입력 → Add
3. 도메인 등록기관(가비아 등)에서 DNS 설정:

**방법 A — Vercel Nameserver (추천)**
```
도메인 네임서버를 Vercel로 변경:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**방법 B — CNAME 레코드**
```
타입: CNAME
호스트: @
값: cname.vercel-dns.com
```

**방법 C — A 레코드**
```
타입: A
호스트: @
값: 76.76.21.21
```

4. SSL 인증서는 Vercel이 자동 발급 (Let's Encrypt)

### 4단계: 확인

- `https://z-ipvalue.com` 접속 확인
- "특허 등록" → 번호 입력 → 조회 테스트
- KIPRIS 연동 및 Claude SMK 생성 확인

---

## 프로젝트 구조

```
z-ipvalue/
├── app/
│   ├── layout.jsx          # HTML 메타데이터, SEO
│   ├── page.jsx            # 메인 플랫폼 (프론트엔드)
│   └── api/
│       └── kipris/
│           ├── bib/route.js     # KIPRIS 서지정보 프록시
│           ├── family/route.js  # KIPRIS 패밀리특허 프록시
│           └── search/route.js  # 통합 검색 + Claude SMK 생성
├── .env.example             # 환경변수 템플릿
├── next.config.js           # Next.js 설정
├── vercel.json              # Vercel 배포 설정 (서울 리전)
└── package.json
```

## API 엔드포인트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/kipris/bib?applicationNumber=1020240012345` | GET | 서지정보 조회 |
| `/api/kipris/family?applicationNumber=1020240012345` | GET | 패밀리특허 조회 |
| `/api/kipris/search` | POST | 통합 검색 + SMK 생성 |

## 보안 구조

- **API 키**: 서버 환경변수에만 존재 (브라우저에 노출 안 됨)
- **관리자 인증**: Web Crypto API (PBKDF2 + AES-256-GCM)
- **브루트포스 방지**: 5회 실패 시 지수적 잠금
- **마스터 리셋**: 비밀번호 분실 시 2단계 확인 후 초기화

## 로컬 개발

```bash
npm install
cp .env.example .env.local  # 키 값 입력
npm run dev                  # http://localhost:3000
```

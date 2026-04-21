export const metadata = {
  title: 'IP Value — 제니스특허법률사무소 기술이전 플랫폼',
  description: '대학·연구소 특허 기술을 기업과 연결하는 IP 기술이전 플랫폼',
  metadataBase: new URL('https://z-ipvalue.com'),
  openGraph: {
    title: 'IP Value — 제니스특허법률사무소',
    description: '대학·연구소 특허 기술을 기업과 연결합니다',
    url: 'https://z-ipvalue.com',
    siteName: 'IP Value',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

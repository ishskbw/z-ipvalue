"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";


const FIELDS = ["전체", "AI/SW", "바이오", "소재", "에너지", "전자", "환경"];
const TYPES = ["전체", "라이선스", "매각", "라이선스/매각"];
const STATUSES = ["전체", "공개", "협의중", "완료"];

const fieldColors = {
  "AI/SW": { bg: "#f0ede8", text: "#4338CA", border: "#e0dbd4" },
  "바이오": { bg: "#f0ede8", text: "#047857", border: "#e0dbd4" },
  "소재": { bg: "#f0ede8", text: "#C2410C", border: "#e0dbd4" },
  "에너지": { bg: "#f0ede8", text: "#8a6d2b", border: "#e0dbd4" },
  "전자": { bg: "#f0ede8", text: "#0369A1", border: "#e0dbd4" },
  "환경": { bg: "#f0ede8", text: "#15803D", border: "#e0dbd4" },
};

const statusColors = {
  "공개": { bg: "transparent", text: "transparent" },  // 공개 상태는 배지 미표시 (깔끔)
  "협의중": { bg: "#fdf6ec", text: "#8a6d2b" },
  "완료": { bg: "#f0f5f1", text: "#2d5a3e" },
};

// ─── Styles (matching ipzenith.com design) ─────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Sora:wght@300;400;500;600&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

:root {
  --oxblood: #6B1D2E;
  --oxblood-light: #8a2e42;
  --dark: #1a1815;
  --dark-mid: #2a2520;
  --ivory: #faf8f5;
  --ivory-dark: #f0ede8;
  --white: #ffffff;
  --border: #e8e4de;
  --text: #1a1815;
  --text-mid: #5a5550;
  --text-light: #8a8580;
  --text-lighter: #b5b0aa;
  --gold: #C89A4E;
  --gold-light: #e8c88a;
  --radius: 2px;
  --shadow-sm: 0 1px 3px rgba(26,24,21,0.04);
  --shadow-md: 0 4px 20px rgba(26,24,21,0.06);
  --shadow-lg: 0 12px 40px rgba(107,29,46,0.08);
}

* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Sora','Noto Sans KR',sans-serif; background:var(--ivory); color:var(--text); }

.platform { min-height:100vh; display:flex; flex-direction:column; }

/* ── Top Bar ── ipzenith.com과 통일된 스타일 */
.top-bar {
  background:var(--dark); color:var(--text-lighter); padding:10px 32px;
  font-size:11px; letter-spacing:.5px; display:flex; justify-content:space-between; align-items:center;
}
.top-bar-left { display:flex; align-items:center; gap:14px; }
.top-bar-right { display:flex; align-items:center; gap:6px; }
.top-bar a { color:var(--text-lighter); text-decoration:none; transition:color .2s; }
.top-bar a:hover { color:#fff; }
.top-bar-item { color:var(--text-lighter); }
.top-bar-divider { width:1px; height:10px; background:rgba(255,255,255,.15); }
.lang-btn {
  padding:3px 9px; font-size:10px; font-weight:500; letter-spacing:.5px;
  color:var(--text-lighter); border:1px solid transparent; cursor:pointer; transition:all .2s;
  font-family:'Sora','Noto Sans KR',sans-serif;
}
.lang-btn:hover { color:#fff; }
.lang-btn.active { background:var(--oxblood); color:#fff; border-color:var(--oxblood); }
.top-login-btn {
  margin-left:8px; padding:4px 12px; font-size:10px; font-weight:500; letter-spacing:.5px;
  border:1px solid rgba(255,255,255,.25); color:var(--text-lighter);
  transition:all .2s; font-family:'Sora','Noto Sans KR',sans-serif;
}
.top-login-btn:hover { border-color:#fff; color:#fff; }

/* ── Header ── */
.header {
  background:var(--white); border-bottom:1px solid var(--border);
  padding:0 32px; height:72px; display:flex; align-items:center; justify-content:space-between;
  position:sticky; top:0; z-index:100;
}
.header-left { display:flex; align-items:center; gap:40px; }
.logo-area { display:flex; flex-direction:column; cursor:pointer; text-decoration:none; }
.logo-text {
  font-family:'DM Serif Display',serif; font-size:30px; color:var(--dark);
  letter-spacing:.5px; line-height:1; display:inline-flex; align-items:baseline;
}
.logo-text .logo-z { color:var(--oxblood); font-size:40px; font-weight:400; margin-right:1px; position:relative; top:2px; letter-spacing:-2px; }
.logo-sub { font-size:10px; color:var(--text-light); letter-spacing:1px; margin-top:2px; font-weight:500; }

.nav { display:flex; gap:0; }
.nav-btn {
  background:none; border:none; color:var(--text-mid); font-size:13px; font-weight:500;
  padding:10px 18px; cursor:pointer; transition:all .2s; position:relative;
  font-family:'Sora','Noto Sans KR',sans-serif; text-transform:uppercase; letter-spacing:1px;
}
.nav-btn:hover { color:var(--oxblood); }
.nav-btn.active { color:var(--oxblood); }
.nav-btn.active::after {
  content:''; position:absolute; left:18px; right:18px; bottom:-26px;
  height:3px; background:var(--oxblood);
}

.header-right { display:flex; align-items:center; gap:12px; }
.upload-btn {
  background:var(--oxblood); color:#fff; border:none; padding:10px 22px;
  font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
  cursor:pointer; transition:all .2s; font-family:'Sora',sans-serif;
  display:flex; align-items:center; gap:8px;
}
.upload-btn:hover { background:var(--dark); }

/* ── Hero ── */
.hero {
  background:var(--dark); padding:100px 32px 110px; position:relative; overflow:hidden;
}
.hero::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg,rgba(26,24,21,.92) 0%,rgba(26,24,21,.75) 45%,rgba(26,24,21,.4) 100%);
}
.hero::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(180deg,transparent 60%,rgba(26,24,21,.6) 100%);
}
.hero-content { max-width:1200px; margin:0 auto; position:relative; z-index:1; }
.hero-firm {
  font-size:13px; color:var(--gold-light); letter-spacing:3.5px; text-transform:uppercase;
  margin-bottom:28px; font-weight:600; display:flex; align-items:center; gap:14px;
}
.hero-firm::before { content:''; width:44px; height:1.5px; background:var(--gold-light); }
.hero h1 {
  font-family:'DM Serif Display',serif; font-size:64px; font-weight:400;
  color:#fff; line-height:1.1; letter-spacing:-1px;
}
.hero h1 span { color:var(--gold); font-family:'DM Serif Display',serif; font-style:normal; }
.hero-desc { font-size:15px; color:#d5d0ca; max-width:560px; margin-top:28px; line-height:1.8; }

.stats-row { display:flex; gap:48px; margin-top:48px; }
.stat-card { text-align:left; }
.stat-num { font-family:'DM Serif Display',serif; font-size:44px; color:#fff; line-height:1; }
.stat-label { font-size:11px; color:#c9c4be; letter-spacing:2px; text-transform:uppercase; margin-top:8px; font-weight:500; }

/* ── Content ── */
.content { max-width:1200px; margin:0 auto; padding:40px 32px; width:100%; }

/* ── Role Tabs ── */
.role-tabs {
  display:flex; gap:0; margin-bottom:24px; width:fit-content;
  border:1px solid var(--border); background:var(--white);
}
.role-tab {
  padding:10px 24px; border:none; font-size:12px; font-weight:500;
  cursor:pointer; transition:all .2s; font-family:'Sora','Noto Sans KR',sans-serif;
  background:none; color:var(--text-mid); letter-spacing:.5px;
}
.role-tab.active { background:var(--oxblood); color:#fff; }
.role-tab:not(.active):hover { color:var(--oxblood); }

/* ── Filters ── */
.filters-bar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
.search-box { flex:1; min-width:240px; position:relative; }
.search-box input {
  width:100%; padding:11px 16px 11px 42px; border:1px solid var(--border);
  background:var(--white); font-size:14px; outline:none;
  font-family:'Sora','Noto Sans KR',sans-serif; transition:border-color .2s;
}
.search-box input:focus { border-color:var(--oxblood); }
.search-box svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-light); }

.filter-group { display:flex; gap:4px; flex-wrap:wrap; }
.filter-chip {
  padding:6px 14px; border:1px solid var(--border); font-size:11px;
  cursor:pointer; transition:all .2s; background:var(--white); color:var(--text-mid);
  font-family:'Sora','Noto Sans KR',sans-serif; font-weight:500; letter-spacing:.5px;
  text-transform:uppercase;
}
.filter-chip:hover { border-color:var(--oxblood); color:var(--oxblood); }
.filter-chip.active { background:var(--oxblood); color:#fff; border-color:var(--oxblood); }

/* ── Patent Grid ── */
.patent-grid {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
  gap:2px; margin-bottom:40px; background:var(--border); border:1px solid var(--border);
}
.patent-card {
  background:var(--white); overflow:hidden; transition:all .3s; cursor:pointer; position:relative;
  padding:0; display:flex; flex-direction:column;
}
.patent-card:hover { border-color:var(--oxblood); box-shadow:var(--shadow-lg); transform:translateY(-3px); }
.card-top { padding:28px 24px 0; flex:1; }
.card-badges { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
.badge {
  padding:3px 10px; font-size:10px; font-weight:600; letter-spacing:.5px;
  text-transform:uppercase; display:inline-flex; align-items:center;
}
.card-title {
  font-family:'DM Serif Display',serif; font-size:19px; font-weight:400;
  line-height:1.3; margin-bottom:8px; color:var(--dark);
}
.card-summary {
  font-size:13px; color:var(--text-mid); line-height:1.6; margin-bottom:14px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.card-keywords { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:14px; }
.keyword {
  font-size:10px; color:var(--text-light); background:var(--ivory);
  padding:3px 8px; letter-spacing:.3px;
}
.card-bottom {
  padding:14px 24px; border-top:1px solid var(--border);
  display:flex; justify-content:space-between; align-items:center;
}
.card-org { font-size:12px; color:var(--text-mid); font-weight:500; }
.card-price { font-size:13px; font-weight:600; color:var(--oxblood); }
.card-action-btn {
  position:absolute; bottom:14px; right:24px; display:none;
  background:var(--oxblood); color:#fff; border:none; padding:6px 14px;
  font-size:11px; font-weight:600; cursor:pointer; letter-spacing:1px;
  font-family:'Sora',sans-serif; text-transform:uppercase;
}
.patent-card:hover .card-action-btn { display:block; }

.trl-bar { height:3px; background:var(--ivory-dark); margin-bottom:14px; overflow:hidden; }
.trl-fill { height:100%; transition:width .5s; }

.card-meta-row {
  display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px;
  padding:8px 12px; background:var(--ivory); font-size:11px;
}
.card-meta-row .meta-item { display:flex; align-items:center; gap:4px; color:var(--text-mid); }
.card-meta-row .meta-label { color:var(--text-light); font-weight:400; }
.card-meta-row .meta-value { font-weight:600; color:var(--text); }
.card-meta-row .meta-divider { width:1px; height:12px; background:var(--border); }
.exam-badge {
  display:inline-flex; align-items:center; gap:3px; padding:2px 8px;
  font-size:10px; font-weight:600; letter-spacing:.3px;
}
.exam-badge.reviewing { background:#fdf6ec; color:#8a6d2b; }
.exam-badge.registered { background:#f0f5f1; color:#2d5a3e; }
.exam-badge .dot { width:5px; height:5px; border-radius:50%; }
.exam-badge.reviewing .dot { background:#C89A4E; }
.exam-badge.registered .dot { background:#2d5a3e; }
.overseas-flags { display:inline-flex; gap:3px; }
.overseas-flag {
  padding:1px 6px; font-size:9px; font-weight:700;
  background:var(--dark); color:#fff; letter-spacing:.5px;
}
.overseas-none { font-size:11px; color:var(--text-light); font-weight:400; }

/* ── Modal ── */
.modal-overlay {
  position:fixed; inset:0; background:rgba(26,24,21,.55); z-index:200;
  display:flex; align-items:center; justify-content:center; padding:20px;
  backdrop-filter:blur(6px); animation:fadeIn .2s;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

.modal {
  background:var(--white); border:1px solid var(--border); max-width:820px; width:100%;
  max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(26,24,21,.2);
  animation:slideUp .3s; position:relative;
}
.modal-header {
  padding:24px 28px 18px; border-bottom:1px solid var(--border);
  display:flex; justify-content:space-between; align-items:flex-start;
}
.modal-close {
  width:36px; height:36px; border:1px solid var(--border);
  background:none; cursor:pointer; font-size:18px; color:var(--text-mid);
  display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0;
}
.modal-close:hover { border-color:var(--oxblood); color:var(--oxblood); }
.modal-body { padding:24px 28px 28px; }
.modal-section { margin-bottom:14px; }
.modal-section h4 {
  font-size:11px; font-weight:600; color:var(--text-light); text-transform:uppercase;
  letter-spacing:2px; margin-bottom:6px;
}
.modal-section p { font-size:13.5px; line-height:1.7; color:var(--text-mid); }

.info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:2px; margin-bottom:18px; background:var(--border); border:1px solid var(--border); }
.info-item { background:var(--white); padding:12px 16px; }
.info-label { font-size:10px; color:var(--text-light); font-weight:600; text-transform:uppercase; letter-spacing:1px; }
.info-value { font-size:13px; font-weight:500; color:var(--text); margin-top:2px; }

.figures-section { margin-bottom:16px; }
.figures-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px; }
.figure-card { background:var(--white); overflow:hidden; border:1px solid var(--border); }
.figure-thumb {
  height:auto; min-height:80px; background:var(--ivory); display:flex; align-items:center; justify-content:center;
  font-size:36px; border-bottom:1px solid var(--border); padding:8px;
}
.figure-thumb img { max-width:100%; max-height:240px; object-fit:contain; display:block; }
.figure-info { padding:12px 14px; }
.figure-title { font-size:12px; font-weight:600; color:var(--dark); margin-bottom:3px; }
.figure-desc { font-size:11px; color:var(--text-mid); line-height:1.5; }

/* ── Inquiry Form ── */
.inquiry-form { background:var(--ivory); padding:24px; margin-top:18px; border:1px solid var(--border); }
.inquiry-form h3 { font-family:'DM Serif Display',serif; font-size:18px; font-weight:400; margin-bottom:4px; color:var(--dark); }
.inquiry-form .form-sub { font-size:12px; color:var(--text-light); margin-bottom:16px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.form-field { display:flex; flex-direction:column; gap:4px; }
.form-field label { font-size:11px; font-weight:600; color:var(--text-mid); text-transform:uppercase; letter-spacing:.5px; }
.form-field input, .form-field select, .form-field textarea {
  padding:10px 14px; border:1px solid var(--border); font-size:13px;
  font-family:'Sora','Noto Sans KR',sans-serif; outline:none; background:var(--white);
  transition:border-color .2s;
}
.form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color:var(--oxblood); }
.form-field textarea { resize:vertical; min-height:70px; }
.form-submit {
  width:100%; padding:12px; background:var(--oxblood); color:#fff; border:none;
  font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
  cursor:pointer; margin-top:10px; font-family:'Sora',sans-serif; transition:all .2s;
}
.form-submit:hover { background:var(--dark); }

/* ── Upload Page ── */
.upload-page { max-width:800px; margin:0 auto; }
.upload-page h2 { font-family:'DM Serif Display',serif; font-size:32px; font-weight:400; margin-bottom:6px; color:var(--dark); }
.upload-page .page-desc { color:var(--text-mid); font-size:14px; margin-bottom:28px; }
.drop-zone {
  border:2px dashed var(--border); padding:48px; text-align:center;
  background:var(--white); transition:all .3s; cursor:pointer;
}
.drop-zone.dragover { border-color:var(--oxblood); background:rgba(107,29,46,.02); }
.drop-zone-icon { font-size:48px; margin-bottom:12px; }
.drop-zone h3 { font-family:'DM Serif Display',serif; font-size:18px; font-weight:400; margin-bottom:6px; }
.drop-zone p { font-size:13px; color:var(--text-light); }

.smk-result { margin-top:28px; }
.smk-card { background:var(--white); border:1px solid var(--border); overflow:hidden; }
.smk-header {
  background:var(--dark); padding:18px 24px; display:flex; justify-content:space-between; align-items:center;
}
.smk-header h3 { color:#fff; font-family:'DM Serif Display',serif; font-size:16px; font-weight:400; }
.smk-header span { color:var(--gold-light); font-size:11px; letter-spacing:1px; }
.smk-tabs { display:flex; border-bottom:1px solid var(--border); }
.smk-tab {
  padding:12px 20px; font-size:12px; font-weight:600; cursor:pointer;
  border-bottom:3px solid transparent; color:var(--text-mid); background:none;
  border-top:none; border-left:none; border-right:none;
  font-family:'Sora','Noto Sans KR',sans-serif; letter-spacing:.5px; text-transform:uppercase;
}
.smk-tab.active { color:var(--oxblood); border-bottom-color:var(--oxblood); }
.smk-body { padding:24px; }
.smk-field { margin-bottom:16px; }
.smk-field label {
  display:block; font-size:10px; font-weight:700; color:var(--oxblood);
  text-transform:uppercase; letter-spacing:1.5px; margin-bottom:5px;
}
.smk-field p { font-size:13.5px; line-height:1.65; color:var(--text); }
.smk-field .tags { display:flex; gap:6px; flex-wrap:wrap; }
.smk-field .tag {
  background:var(--ivory); padding:4px 10px; font-size:11px;
  color:var(--text-mid); font-weight:500; letter-spacing:.3px;
}
.smk-register-btn {
  margin-top:20px; width:100%; padding:14px; background:var(--oxblood);
  color:#fff; border:none; font-size:12px; font-weight:600; letter-spacing:2px;
  text-transform:uppercase; cursor:pointer; font-family:'Sora',sans-serif; transition:all .2s;
}
.smk-register-btn:hover { background:var(--dark); }

.pdf-viewer {
  width:100%; height:500px; border:none; background:var(--ivory);
  display:flex; align-items:center; justify-content:center;
}

.loading-state { text-align:center; padding:40px; }
.spinner { width:40px; height:40px; border:3px solid var(--border); border-top-color:var(--oxblood);
  border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 16px; }
@keyframes spin { to{transform:rotate(360deg)} }

/* ── Process Page ── */
.process-page h2 { font-family:'DM Serif Display',serif; font-size:32px; font-weight:400; margin-bottom:6px; color:var(--dark); }
.process-page .page-desc { color:var(--text-mid); font-size:14px; margin-bottom:36px; }

.process-timeline { position:relative; }
.process-line { position:absolute; left:28px; top:0; bottom:0; width:1px; background:var(--border); }
.process-step { display:flex; gap:24px; margin-bottom:2px; position:relative; }
.step-num {
  width:56px; height:56px; display:flex; align-items:center; justify-content:center;
  font-family:'DM Serif Display',serif; font-size:22px; font-weight:400; color:#fff; flex-shrink:0; z-index:1;
}
.step-content {
  flex:1; background:var(--white); padding:24px 28px;
  border:1px solid var(--border); transition:all .3s;
}
.step-content:hover { border-color:var(--oxblood); box-shadow:var(--shadow-lg); }
.step-content h3 { font-family:'DM Serif Display',serif; font-size:20px; font-weight:400; margin-bottom:6px; color:var(--dark); }
.step-content p { font-size:13px; color:var(--text-mid); line-height:1.65; margin-bottom:10px; }
.step-roles { display:flex; gap:6px; flex-wrap:wrap; }
.role-badge { padding:3px 10px; font-size:10px; font-weight:600; letter-spacing:.5px; text-transform:uppercase; }
.role-holder { background:var(--ivory); color:var(--text-mid); border:1px solid var(--border); }
.role-buyer { background:#f0f5f1; color:#2d5a3e; border:1px solid #d5e8dc; }
.role-attorney { background:#fdf6ec; color:#8a6d2b; border:1px solid #f0e4cc; }

/* ── Footer ── */
.footer {
  background:var(--dark); padding:40px 32px; margin-top:auto;
}
.footer-content { max-width:1200px; margin:0 auto; display:flex; justify-content:space-between;
  align-items:center; flex-wrap:wrap; gap:16px; }
.footer-name { font-family:'DM Serif Display',serif; color:#fff; font-size:18px; margin-bottom:6px; font-weight:400; }
.footer-info { color:var(--text-lighter); font-size:12px; line-height:1.8; }
.footer-info a { color:var(--gold-light); text-decoration:none; }
.footer-right { color:var(--text-lighter); font-size:11px; letter-spacing:1px; }

/* ── Empty state ── */
.empty-state { text-align:center; padding:60px 20px; color:var(--text-light); }
.empty-state p { font-size:14px; }

/* ── Toast ── */
.toast {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  background:var(--dark); color:#fff; padding:14px 28px;
  font-size:13px; font-weight:500; box-shadow:0 8px 32px rgba(26,24,21,.3); z-index:300;
  animation:slideUp .3s; letter-spacing:.3px;
}

/* ── Responsive ── */
@media (max-width:768px) {
  .header { padding:0 16px; height:60px; }
  .nav { display:none; }
  .hero { padding:56px 16px 64px; }
  .hero h1 { font-size:32px; }
  .content { padding:20px 16px; }
  .patent-grid { grid-template-columns:1fr; }
  .form-row { grid-template-columns:1fr; }
  .info-grid { grid-template-columns:1fr 1fr; }
  .figures-grid { grid-template-columns:1fr; }
  .stats-row { gap:24px; flex-wrap:wrap; }
  .stat-num { font-size:32px; }
  .filters-bar { flex-direction:column; }
  .top-bar { display:none; }
  .logo-text { font-size:22px; }
  .logo-text .logo-z { font-size:30px; }
}`;

function TRLBar({ level }) {
  const pct = (level / 9) * 100;
  const color = level >= 7 ? "#2d5a3e" : level >= 5 ? "#D97706" : "#DC2626";
  return (
    <div className="trl-bar">
      <div className="trl-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Badge({ text, colors }) {
  // 플랫폼 상태 "공개"는 배지 없이 깔끔하게 (기본 상태)
  if (!text || !colors || text === "공개") return null;
  return (
    <span className="badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border || colors.bg}` }}>
      {text}
    </span>
  );
}

// ─── Main App ─────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("browse");
  const [role, setRole] = useState("holder");
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedPatent, setSelectedPatent] = useState(null);
  const [toast, setToast] = useState(null);

  // Supabase 특허 데이터
  const [patents, setPatents] = useState([]);
  const [patentsLoading, setPatentsLoading] = useState(true);
  // Supabase 로그인 세션 (플랫폼 등록 신청 시 필요)
  const [supabaseSession, setSupabaseSession] = useState(null);
  // 카테고리 확인 모달 상태 (저장 전에 카테고리 재확인용)
  const [categoryConfirm, setCategoryConfirm] = useState(null); // { suggested: 'AI/SW', selected: 'AI/SW', dealType: '라이선스' } or null

  // DB → UI 필드 매핑 (카드 렌더링용)
  const mapDbRowToUi = (p) => ({
    id: p.id,
    title: p.title,
    field: p.category,
    type: p.deal_type,
    status: p.status,
    trl: p.trl_level || 0,
    org: p.holder || "",
    inventor: p.inventor || "",
    patentNo: p.application_no || "",
    price: p.price_display || "협의",
    filingDate: p.application_date ? p.application_date.replace(/-/g, ".") : "",
    examStatus: p.examination_status || "",
    overseas: p.foreign_countries || [],
    overseasDetail: p.overseas_detail || [],
    summary: p.description || "",
    keywords: p.tags || [],
    likes: p.likes || 0,
    detail: p.detail || p.description || "",
    figures: p.figures || [],
    // 법률현황 / 명세서 전문
    registrationNumber: p.registration_no || null,
    registrationDate: p.registration_date ? p.registration_date.replace(/-/g, ".") : null,
    publicationNumber: p.publication_number || null,
    fullTextXml: p.full_text_xml || null,
    kiprisLinked: !!(p.registration_no || p.publication_number || p.full_text_xml),
  });

  // Supabase에서 공개된 특허 목록 불러오기
  const loadPatentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("patents")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPatents((data || []).map(mapDbRowToUi));
    } catch (err) {
      console.error("Supabase 특허 로딩 실패:", err);
      setPatents([]);
    } finally {
      setPatentsLoading(false);
    }
  };

  useEffect(() => {
    loadPatentsFromSupabase();
    // Supabase 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [smkData, setSmkData] = useState(null);
  const [smkLoading, setSmkLoading] = useState(false);
  const [smkTab, setSmkTab] = useState("smk");
  const [dragOver, setDragOver] = useState(false);
  const [kiprisKey, setKiprisKey] = useState("");
  const [loadingStep, setLoadingStep] = useState("");
  const [uploadMode, setUploadMode] = useState("number"); // "pdf" or "number"
  const [patentInput, setPatentInput] = useState("");
  const [patentInputType, setPatentInputType] = useState("application");
  const [kiprisKeySaved, setKiprisKeySaved] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminModal, setAdminModal] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState("");
  const [adminHasPassword, setAdminHasPassword] = useState(false);
  const [adminSetupMode, setAdminSetupMode] = useState(false);
  const [adminPwConfirm, setAdminPwConfirm] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [resetStep, setResetStep] = useState(0); // 0=hidden, 1=confirm, 2=final
  const [inquiryForm, setInquiryForm] = useState({ company: "", name: "", contact: "", dealType: "", message: "" });
  const FIRM_EMAIL = "info@ipzenith.com";
  const fileInputRef = useRef(null);
  const pdfjsRef = useRef(null);

  // ─── Web Crypto API helpers ───────────────────────────
  const getCrypto = () => typeof window !== "undefined" ? (window.crypto || window.msCrypto) : null;
  const te = new TextEncoder();
  const td = new TextDecoder();
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  // PBKDF2: derive key from password + salt
  const deriveKey = async (password, salt, usage) => {
    const crypto = getCrypto();
    const baseKey = await crypto.subtle.importKey("raw", te.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      baseKey,
      { name: usage === "hash" ? "HMAC" : "AES-GCM", ...(usage === "hash" ? { hash: "SHA-256", length: 256 } : { length: 256 }) },
      true,
      usage === "hash" ? ["sign"] : ["encrypt", "decrypt"]
    );
  };

  // Hash password with PBKDF2 + random salt
  const hashPassword = async (password) => {
    const crypto = getCrypto();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt, "hash");
    const sig = await crypto.subtle.sign("HMAC", key, te.encode(password));
    return { salt: toB64(salt), hash: toB64(sig) };
  };

  // Verify password against stored hash
  const verifyPassword = async (password, storedSalt, storedHash) => {
    const crypto = getCrypto();
    const salt = fromB64(storedSalt);
    const key = await deriveKey(password, salt, "hash");
    const sig = await crypto.subtle.sign("HMAC", key, te.encode(password));
    return toB64(sig) === storedHash;
  };

  // AES-GCM encrypt (key derived from password)
  const encryptData = async (plaintext, password) => {
    const crypto = getCrypto();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, "encrypt");
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(plaintext));
    return JSON.stringify({ s: toB64(salt), iv: toB64(iv), ct: toB64(ct) });
  };

  // AES-GCM decrypt
  const decryptData = async (encJson, password) => {
    try {
      const crypto = getCrypto();
      const { s, iv, ct } = JSON.parse(encJson);
      const key = await deriveKey(password, fromB64(s), "encrypt");
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ct));
      return td.decode(pt);
    } catch { return null; }
  };

  // localStorage wrapper (replaces window.storage for deployed environment)
  const store = {
    get: (key) => { const v = localStorage.getItem(key); return v ? { value: v } : null; },
    set: (key, value) => { localStorage.setItem(key, value); return { key, value }; },
    delete: (key) => { localStorage.removeItem(key); return { key, deleted: true }; },
  };

  // Check if admin password exists on mount
  useEffect(() => {
    (async () => {
      try {
        const p = store.get("admin-pw");
        if (p?.value) setAdminHasPassword(true);
      } catch(e) {}
      try {
        const k = store.get("kipris-enc");
        if (k?.value) setKiprisKeySaved(true);
      } catch(e) {}
    })();
  }, []);

  // Admin login with brute-force protection
  const handleAdminLogin = async () => {
    // Lockout check
    if (lockoutUntil > Date.now()) {
      const sec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setAdminPwError(`너무 많은 시도. ${sec}초 후 다시 시도하세요.`);
      return;
    }
    if (!adminPwInput.trim()) { setAdminPwError("비밀번호를 입력하세요."); return; }

    if (adminSetupMode) {
      if (adminPwInput.length < 6) { setAdminPwError("6자 이상 입력하세요."); return; }
      if (adminPwInput !== adminPwConfirm) { setAdminPwError("비밀번호가 일치하지 않습니다."); return; }
      try {
        const { salt, hash } = await hashPassword(adminPwInput);
        store.set("admin-pw", JSON.stringify({ salt, hash }));
        // If there's an existing API key in memory, encrypt it with new password
        if (kiprisKey) {
          const encKey = await encryptData(kiprisKey, adminPwInput);
          store.set("kipris-enc", encKey);
          setKiprisKeySaved(true);
        }
      } catch(e) { setAdminPwError("설정 오류"); return; }
      setAdminHasPassword(true); setAdminAuth(true); setAdminModal(false);
      setAdminPwInput(""); setAdminPwConfirm(""); setAdminPwError(""); setLoginAttempts(0);
      showToast("✓ 관리자 비밀번호가 설정되었습니다.");
    } else {
      try {
        const stored = store.get("admin-pw");
        if (!stored?.value) { setAdminPwError("저장된 비밀번호가 없습니다."); return; }
        const { salt, hash } = JSON.parse(stored.value);
        const valid = await verifyPassword(adminPwInput, salt, hash);
        if (valid) {
          setAdminAuth(true); setLoginAttempts(0);
          // Decrypt API key if exists
          try {
            const encKey = store.get("kipris-enc");
            if (encKey?.value) {
              const decrypted = await decryptData(encKey.value, adminPwInput);
              if (decrypted) { setKiprisKey(decrypted); setKiprisKeySaved(true); }
            }
          } catch(e) {}
          setAdminModal(false); setAdminPwInput(""); setAdminPwError("");
        } else {
          const attempts = loginAttempts + 1;
          setLoginAttempts(attempts);
          if (attempts >= 5) {
            const delay = Math.min(30000, 5000 * Math.pow(2, attempts - 5));
            setLockoutUntil(Date.now() + delay);
            setAdminPwError(`비밀번호 ${attempts}회 오류. ${delay/1000}초 후 재시도 가능.`);
          } else {
            setAdminPwError(`비밀번호가 틀렸습니다. (${attempts}/5)`);
          }
        }
      } catch(e) { setAdminPwError("인증 오류"); }
    }
  };

  // Save API key — encrypted with admin password (requires re-entering pw)
  const [savePwPrompt, setSavePwPrompt] = useState(false);
  const [savePwInput, setSavePwInput] = useState("");

  const saveKiprisKey = async (key) => {
    if (!key.trim()) return;
    // Need admin password to encrypt
    if (!savePwInput.trim()) { setSavePwPrompt(true); return; }
    try {
      // Verify password first
      const stored = store.get("admin-pw");
      if (stored?.value) {
        const { salt, hash } = JSON.parse(stored.value);
        const valid = await verifyPassword(savePwInput, salt, hash);
        if (!valid) { showToast("비밀번호가 틀렸습니다."); setSavePwInput(""); return; }
      }
      const encKey = await encryptData(key, savePwInput);
      store.set("kipris-enc", encKey);
      setKiprisKeySaved(true); setSavePwPrompt(false); setSavePwInput("");
      showToast("✓ API 키가 AES-256으로 암호화 저장되었습니다.");
    } catch(e) { showToast("키 저장 실패"); }
  };

  const deleteKiprisKey = async () => {
    try { store.delete("kipris-enc"); } catch(e) {}
    setKiprisKey(""); setKiprisKeySaved(false); setShowKeyInput(false); showToast("API 키가 삭제되었습니다.");
  };

  // Master reset — deletes all admin data
  const masterReset = async () => {
    try { store.delete("admin-pw"); } catch(e) {}
    try { store.delete("kipris-enc"); } catch(e) {}
    setAdminAuth(false); setAdminHasPassword(false); setKiprisKey("");
    setKiprisKeySaved(false); setAdminModal(false); setResetStep(0);
    setAdminPwInput(""); setAdminPwError(""); setLoginAttempts(0); setLockoutUntil(0);
    showToast("전체 초기화 완료. 비밀번호와 API 키를 다시 설정하세요.");
  };

  // Load PDF.js from CDN
  useEffect(() => {
    if (pdfjsRef.current) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = window["pdfjs-dist/build/pdf"];
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        pdfjsRef.current = pdfjsLib;
      }
    };
    document.head.appendChild(script);
  }, []);

  // Render specific PDF pages as data URL thumbnails
  const renderPdfPages = async (arrayBuffer, pageNumbers, thumbHeight = 280) => {
    const pdfjsLib = pdfjsRef.current;
    if (!pdfjsLib) return [];
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const results = [];
      for (const pn of pageNumbers) {
        if (pn < 1 || pn > pdf.numPages) continue;
        try {
          const pg = await pdf.getPage(pn);
          const vp = pg.getViewport({ scale: 1 });
          const scale = thumbHeight / vp.height;
          const scaledVp = pg.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = scaledVp.width;
          canvas.height = scaledVp.height;
          const ctx = canvas.getContext("2d");
          await pg.render({ canvasContext: ctx, viewport: scaledVp }).promise;
          results.push({ page: pn, dataUrl: canvas.toDataURL("image/png") });
        } catch (e) { console.warn(`Page ${pn} render error`, e); }
      }
      return results;
    } catch (e) { console.error("PDF render error", e); return []; }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ────────────────────────────────────────────
  // 플랫폼 등록 신청 (1단계) → 카테고리·거래형태 확인 모달 열기
  // ────────────────────────────────────────────
  const openCategoryConfirm = () => {
    if (!supabaseSession) {
      showToast("❌ /admin 에서 먼저 로그인해주세요.");
      return;
    }
    if (!smkData) return;

    // Claude가 반환한 field를 6개 카테고리 중 하나로 추정
    const suggestCategory = (raw) => {
      if (!raw) return "AI/SW";
      const r = raw.toString();
      if (r.match(/AI|SW|소프트웨어|알고리즘|인공지능|데이터|딥러닝|머신러닝/i)) return "AI/SW";
      if (r.match(/바이오|의료|의약|제약|생명|약물|세포|단백|유전/)) return "바이오";
      if (r.match(/소재|재료|복합|고분자|나노|합금|세라믹/)) return "소재";
      if (r.match(/에너지|전지|태양|배터리|연료|발전|수소/)) return "에너지";
      if (r.match(/전자|반도체|센서|디스플레이|회로|통신/)) return "전자";
      if (r.match(/환경|수질|대기|폐기물|오염|친환경/)) return "환경";
      return "AI/SW";
    };

    setCategoryConfirm({
      suggested: smkData.field || "(미분류)",
      selected: suggestCategory(smkData.field),
      dealType: "라이선스/매각", // 기본: 둘 다 가능
    });
  };

  // ────────────────────────────────────────────
  // 플랫폼 등록 신청 (2단계) → 실제 Supabase 저장
  // ────────────────────────────────────────────
  const saveSmkToSupabase = async () => {
    if (!categoryConfirm || !smkData || !supabaseSession) return;

    const mapExamStatus = (raw) => {
      if (!raw) return null;
      if (raw.includes("등록")) return "등록완료";
      if (raw.includes("심사")) return "심사중";
      return null;
    };

    const convertDate = (dateStr) => {
      if (!dateStr || dateStr === "-") return null;
      const m = dateStr.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
      return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
    };

    // 상세설명: Claude가 생성한 여러 섹션을 하나로 결합
    const detail = [
      smkData.core && `■ 핵심 기술\n${smkData.core}`,
      smkData.advantage && `■ 특징 및 장점\n${smkData.advantage}`,
      smkData.application && `■ 활용 분야\n${smkData.application}`,
      smkData.effect && `■ 기대 효과\n${smkData.effect}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const patentData = {
      title: smkData.title || "제목 없음",
      description: smkData.summary || null,
      detail: detail || null,
      category: categoryConfirm.selected, // 사용자가 확인한 값
      deal_type: categoryConfirm.dealType,
      status: "공개",
      trl_level: smkData.trl ? parseInt(smkData.trl) : null,
      application_date: convertDate(smkData.filingDate),
      application_no: smkData.patentNo || null,
      registration_no: smkData.registrationNumber || null,
      registration_date: convertDate(smkData.registrationDate),
      publication_number: smkData.publicationNumber || null,
      full_text_xml: smkData.fullTextXml || null,
      examination_status: mapExamStatus(smkData.examStatus),
      foreign_countries: smkData.overseas || [],
      overseas_detail: smkData.overseasDetail || [],
      tags: smkData.keywords || [],
      holder: smkData.org || null,
      inventor: smkData.inventor || null,
      price_display: null,
      contact_email: null,
      is_published: true,
      // 도면: 이미지 있는 것만 저장 (빈 figure 제외)
      figures: (smkData.figures || [])
        .filter((f) => f && f.imageUrl)
        .map((f) => ({
          page: f.page || null,
          title: f.title || "",
          desc: f.desc || "",
          imageUrl: f.imageUrl,
          icon: "📊",
        })),
    };

    const { error } = await supabase.from("patents").insert([patentData]);
    if (error) {
      showToast("❌ 저장 실패: " + error.message);
      console.error("Supabase insert error:", error);
      return;
    }

    showToast("✅ Supabase에 저장되었습니다. 기술 찾기에서 확인하세요.");

    // 모달 닫고 초기 화면으로
    setCategoryConfirm(null);
    await loadPatentsFromSupabase();
    setSmkData(null);
    setUploadedFile(null);
    setPdfUrl(null);
    setPatentInput("");
    setTimeout(() => setPage("browse"), 800);
  };

  const updateInquiry = (key, val) => setInquiryForm(prev => ({ ...prev, [key]: val }));

  // 이메일 발송 (mailto)
  const sendInquiryEmail = (type) => {
    const p = selectedPatent;
    const subject = type === "buyer"
      ? `[매입문의] ${p.title} (${p.patentNo}) — ${inquiryForm.company}`
      : `[기술이전 상담] ${p.title} (${p.patentNo})`;

    let body = "";
    if (type === "buyer") {
      body = [
        `■ 문의 유형: 매입 의사 타진`,
        ``,
        `■ 대상 기술`,
        `  기술명: ${p.title}`,
        `  특허번호: ${p.patentNo}`,
        `  출원기관: ${p.org}`,
        `  기술분야: ${p.field}`,
        ``,
        `■ 문의 기업 정보`,
        `  회사명: ${inquiryForm.company}`,
        `  담당자: ${inquiryForm.name}`,
        `  연락처: ${inquiryForm.contact}`,
        `  희망 거래형태: ${inquiryForm.dealType}`,
        ``,
        `■ 문의 내용`,
        `${inquiryForm.message}`,
        ``,
        `---`,
        `Zenithvalue (z-ipvalue.com) 기술이전 플랫폼에서 발송됨`,
      ].join("\n");
    } else {
      body = [
        `■ 문의 유형: 기술이전 상담 신청`,
        ``,
        `■ 대상 기술`,
        `  기술명: ${p.title}`,
        `  특허번호: ${p.patentNo}`,
        `  출원기관: ${p.org}`,
        `  발명자: ${p.inventor}`,
        `  기술분야: ${p.field}`,
        `  TRL: Level ${p.trl}`,
        `  희망가: ${p.price}`,
        ``,
        `해당 기술의 이전 상담을 요청합니다.`,
        ``,
        `---`,
        `Zenithvalue (z-ipvalue.com) 기술이전 플랫폼에서 발송됨`,
      ].join("\n");
    }

    const mailto = `mailto:${FIRM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
    setSelectedPatent(null);
    setInquiryForm({ company: "", name: "", contact: "", dealType: "", message: "" });
    showToast("✅ 이메일 작성 화면이 열렸습니다. 발송해주세요.");
  };

  // ─── KIPRIS API Helpers ──────────────────────────────
  // 1) 특허 서지정보 조회 (출원번호 → 등록상태, 출원일 등)
  const fetchKiprisPatentInfo = async (applicationNo) => {
    if (!kiprisKey) return null;
    try {
      const cleanNo = applicationNo.replace(/[^0-9]/g, "");
      const url = `https://apis.data.go.kr/B551024/KpssSearchService/getBibliographySearch?serviceKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${cleanNo}&numOfRows=1&pageNo=1`;
      const res = await fetch(url);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const item = xml.querySelector("item") || xml.querySelector("body");
      if (!item) return null;
      const getVal = (tag) => {
        const el = item.querySelector(tag) || xml.querySelector(tag);
        return el?.textContent?.trim() || null;
      };
      return {
        registrationStatus: getVal("registerStatus") || getVal("registrationStatus") || getVal("detailedRegistrationStatus") || null,
        registrationNumber: getVal("registerNumber") || getVal("registrationNumber") || null,
        applicationDate: getVal("applicationDate") || null,
        publicationDate: getVal("publicationDate") || null,
        registrationDate: getVal("registerDate") || getVal("registrationDate") || null,
        applicantName: getVal("applicantName") || null,
      };
    } catch (err) {
      console.warn("KIPRIS patent info error:", err);
      return null;
    }
  };

  // 2) 패밀리특허 조회 (출원번호 → 해외출원 국가 목록)
  const fetchKiprisFamilyPatents = async (applicationNo) => {
    if (!kiprisKey) return [];
    try {
      const cleanNo = applicationNo.replace(/[^0-9]/g, "");
      const url = `https://apis.data.go.kr/B551024/PatFamInfoSearchService/getAppNoPatFamInfoSearch?serviceKey=${encodeURIComponent(kiprisKey)}&applicationNumber=${cleanNo}&numOfRows=50&pageNo=1`;
      const res = await fetch(url);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const items = xml.querySelectorAll("item");
      const families = [];
      const seenCountries = new Set();
      items.forEach((item) => {
        const countryCode = item.querySelector("familyCountryCode")?.textContent?.trim()
          || item.querySelector("docdbCountryCode")?.textContent?.trim() || "";
        const countryName = item.querySelector("familyCountryName")?.textContent?.trim() || "";
        const familyAppNo = item.querySelector("familyApplicationNumber")?.textContent?.trim()
          || item.querySelector("docdbApplicationNumber")?.textContent?.trim() || "";
        const docType = item.querySelector("documentCode")?.textContent?.trim() || "";
        if (countryCode && countryCode !== "KR" && !seenCountries.has(countryCode)) {
          seenCountries.add(countryCode);
          families.push({ countryCode, countryName, applicationNo: familyAppNo, docType });
        }
      });
      return families;
    } catch (err) {
      console.warn("KIPRIS family patent error:", err);
      return [];
    }
  };

  // Filter logic
  const filtered = patents.filter((p) => {
    if (search && !p.title.includes(search) && !p.summary.includes(search) && !p.keywords.some(k => k.includes(search))) return false;
    if (fieldFilter !== "전체" && p.field !== fieldFilter) return false;
    if (typeFilter !== "전체") {
      // "라이선스/매각" 복합 타입은 '라이선스' 필터와 '매각' 필터 양쪽에서 모두 노출
      const typeMatches =
        p.type === typeFilter ||
        (p.type === "라이선스/매각" && (typeFilter === "라이선스" || typeFilter === "매각"));
      if (!typeMatches) return false;
    }
    if (statusFilter !== "전체" && p.status !== statusFilter) return false;
    return true;
  });

  // PDF upload handler — multi-step: PDF pages → Claude → Figures → KIPRIS → merge
  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      showToast("PDF 파일만 업로드 가능합니다.");
      return;
    }
    setUploadedFile(file);
    setPdfUrl(URL.createObjectURL(file));
    setSmkTab("smk");
    setSmkLoading(true);
    setSmkData(null);
    setLoadingStep("pdf");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(",")[1];
        const arrayBuffer = e.target.result;
        // Also get ArrayBuffer for PDF.js rendering
        const abReader = new FileReader();
        const abPromise = new Promise((resolve) => {
          abReader.onload = (ev) => resolve(ev.target.result);
          abReader.readAsArrayBuffer(file);
        });
        const pdfArrayBuffer = await abPromise;

        let parsed = null;

        // ── Step 1: Claude AI로 명세서 분석 + 도면 페이지 식별 ──
        setLoadingStep("ai");
        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1500,
              messages: [{
                role: "user",
                content: [
                  {
                    type: "document",
                    source: { type: "base64", media_type: "application/pdf", data: base64 }
                  },
                  {
                    type: "text",
                    text: `이 특허 명세서를 분석하여 SMK(기술이전 마케팅 시트)를 작성해주세요. 

도면(Figure) 정보도 반드시 포함해주세요:
- PDF에서 도면이 있는 페이지 번호를 찾아주세요
- 각 도면의 제목과 간단한 설명을 작성해주세요
- 대표 도면 2~4개를 선별해주세요

반드시 아래 JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.
{
  "title": "기술명",
  "field": "기술 분야",
  "trl": 숫자(1-9),
  "patentNo": "출원번호 (10-YYYY-NNNNNNN 형식)",
  "filingDate": "출원일 (YYYY.MM.DD)",
  "inventor": "발명자",
  "org": "출원기관/출원인",
  "summary": "기술 개요 (2-3문장)",
  "core": "핵심 기술 내용 (3-4문장)",
  "advantage": "특징 및 장점 (3-4개 항목)",
  "application": "활용 분야 (3-4개)",
  "effect": "기대 효과 (2-3문장)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "figures": [
    { "page": 페이지번호, "title": "[도 N] 도면 제목", "desc": "도면에 대한 간단한 설명" }
  ]
}`
                  }
                ]
              }]
            })
          });
          const data = await response.json();
          const text = data.content?.map(i => i.text || "").join("\n") || "";
          const clean = text.replace(/```json|```/g, "").trim();
          parsed = JSON.parse(clean);
        } catch (err) {
          console.error("Claude SMK error:", err);
          parsed = {
            title: file.name.replace(".pdf", ""),
            field: "분석 필요", trl: 5, patentNo: "-", filingDate: "-",
            inventor: "-", org: "-",
            summary: "Claude API 연동 확인 필요. 실제 환경에서는 명세서가 자동 분석됩니다.",
            core: "-", advantage: "-", application: "-", effect: "-",
            keywords: ["AI분석", "SMK", "자동생성"],
            figures: []
          };
        }

        // ── Step 2: PDF.js로 도면 페이지 렌더링 ──
        let figuresWithImages = parsed.figures || [];
        if (figuresWithImages.length > 0 && pdfjsRef.current) {
          setLoadingStep("figures");
          const pageNums = figuresWithImages.map(f => f.page).filter(Boolean);
          const renderedPages = await renderPdfPages(pdfArrayBuffer, pageNums);
          figuresWithImages = figuresWithImages.map(fig => {
            const rendered = renderedPages.find(r => r.page === fig.page);
            return { ...fig, imageUrl: rendered?.dataUrl || null };
          });
        }

        // ── Step 2: KIPRIS 서지정보 조회 (심사현황) ──
        let kiprisInfo = null;
        if (kiprisKey && parsed.patentNo && parsed.patentNo !== "-") {
          setLoadingStep("kipris-bib");
          kiprisInfo = await fetchKiprisPatentInfo(parsed.patentNo);
        }

        // ── Step 3: KIPRIS 패밀리특허 조회 (해외출원) ──
        let familyPatents = [];
        if (kiprisKey && parsed.patentNo && parsed.patentNo !== "-") {
          setLoadingStep("kipris-family");
          familyPatents = await fetchKiprisFamilyPatents(parsed.patentNo);
        }

        // ── Merge: 모든 데이터 합치기 ──
        setLoadingStep("merge");
        const examStatus = kiprisInfo?.registrationStatus
          ? (kiprisInfo.registrationStatus.includes("등록") ? "등록완료" : "심사중")
          : "확인필요";
        const overseas = familyPatents.map(f => f.countryCode);
        const overseasDetail = familyPatents;
        const filingDate = kiprisInfo?.applicationDate
          ? kiprisInfo.applicationDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")
          : (parsed.filingDate || "-");

        setSmkData({
          ...parsed,
          filingDate,
          examStatus,
          overseas,
          overseasDetail,
          figures: figuresWithImages,
          kiprisLinked: !!kiprisKey,
          registrationNumber: kiprisInfo?.registrationNumber || null,
          registrationDate: kiprisInfo?.registrationDate
            ? kiprisInfo.registrationDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")
            : null,
        });
        setSmkLoading(false);
        setLoadingStep("");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setSmkLoading(false);
      setLoadingStep("");
      showToast("파일 처리 중 오류가 발생했습니다.");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // ─── 번호 입력 방식: 서버 API 프록시 경유 ───
  const handleNumberSearch = async () => {
    if (!patentInput.trim()) {
      showToast("번호를 입력해주세요.");
      return;
    }
    setSmkLoading(true);
    setSmkData(null);
    setSmkTab("smk");
    setUploadedFile(null);
    setPdfUrl(null);

    try {
      setLoadingStep("kipris-bib");

      // 서버 API Route 호출 (CORS 없음, API 키는 서버 환경변수)
      const res = await fetch("/api/kipris/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patentNo: patentInput,
          searchType: patentInputType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `서버 오류 (${res.status})`);
      }

      setLoadingStep("ai");
      const data = await res.json();

      if (!data.bib || !data.bib.title) {
        showToast("검색 결과가 없습니다. 번호를 확인해주세요.");
        setSmkLoading(false);
        setLoadingStep("");
        return;
      }

      setLoadingStep("merge");
      const fmtDate = (d) => d ? d.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3") : "-";
      const bib = data.bib;
      const examStatus = bib.registerStatus
        ? (bib.registerStatus.includes("등록") ? "등록완료" : "심사중")
        : "확인필요";

      // 전문 XML URL → PDF 프록시 경유
      const xmlUrl = data.pdfUrls?.main || data.pdfUrls?.ann || data.pdfUrls?.pub || "";
      if (xmlUrl) setPdfUrl(`/api/kipris/pdf?url=${encodeURIComponent(xmlUrl)}`);

      // 도면 구성: XML 추출 도면설명 > Claude 도면설명 > 대표도면
      let figures = [];
      const drawingUrl = bib.bigDrawing || "";
      const xmlFigDescs = data.figureDescsFromXml || [];
      const aiFigDescs = data.smk?.figureDescs || [];
      const figDescs = xmlFigDescs.length > 0 ? xmlFigDescs : aiFigDescs;

      if (figDescs.length > 0) {
        figures = figDescs.map((fd, i) => ({
          title: fd.title ? `[${fd.no}] ${fd.title}` : `[${fd.no}]`,
          desc: fd.desc || "",
          imageUrl: i === 0 && drawingUrl ? drawingUrl : null,
        }));
      } else if (drawingUrl) {
        figures = [{ title: "[대표도면]", desc: "", imageUrl: drawingUrl }];
      }

      setSmkData({
        title: bib.title,
        patentNo: bib.applicationNumber ? bib.applicationNumber.replace(/(\d{2})(\d{4})(\d{7})/, "$1-$2-$3") : patentInput,
        filingDate: fmtDate(bib.applicationDate),
        inventor: bib.inventorName,
        org: bib.applicantName,
        examStatus,
        overseas: (data.family || []).map(f => f.countryCode),
        overseasDetail: data.family || [],
        figures,
        kiprisLinked: true,
        registrationNumber: bib.registerNumber || null,
        registrationDate: fmtDate(bib.registerDate),
        publicationNumber: bib.openNumber || null,
        fullTextXml: data.fullTextXml || null,
        ...(data.smk || {}),
      });

      setSmkLoading(false);
      setLoadingStep("");
    } catch (err) {
      console.error("Number search error:", err);
      setSmkLoading(false);
      setLoadingStep("");
      showToast(err.message || "조회 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="platform">
        {/* Top Bar — ipzenith.com과 통일된 스타일 */}
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="top-bar-item">Since 2003</span>
            <span className="top-bar-divider" />
            <a href="tel:+8228883066">+82-2-888-3066</a>
            <span className="top-bar-divider" />
            <a href="mailto:zenith@ipzenith.com">zenith@ipzenith.com</a>
          </div>
          <div className="top-bar-right">
            <span className="lang-btn active">국문</span>
            <span className="lang-btn">ENG</span>
            <span className="lang-btn">日本語</span>
            <span className="lang-btn">中文</span>
            <a
              href="https://www.ipzenith.com"
              target="_blank"
              rel="noopener"
              className="top-login-btn"
              title="제니스특허법률사무소 홈페이지"
            >
              ipzenith.com
            </a>
          </div>
        </div>

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo-area" onClick={() => setPage("browse")}>
              <div className="logo-text"><span className="logo-z">Z</span>enithvalue</div>
              <div className="logo-sub">제니스특허법률사무소 IP 거래 플랫폼</div>
            </div>
            <nav className="nav">
              <button className={`nav-btn ${page === "browse" ? "active" : ""}`} onClick={() => setPage("browse")}>기술 찾기</button>
              <button className={`nav-btn ${page === "upload" ? "active" : ""}`} onClick={() => setPage("upload")}>특허 등록</button>
              <button className={`nav-btn ${page === "process" ? "active" : ""}`} onClick={() => setPage("process")}>거래 절차</button>
            </nav>
          </div>
          <div className="header-right">
            <button className="upload-btn" onClick={() => { setPage("upload"); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              등록하기
            </button>
          </div>
        </header>

        {/* Hero (browse page only) */}
        {page === "browse" && (
          <section className="hero">
            <div className="hero-content">
              <div className="hero-firm">제니스특허법률사무소 · Technology Transfer</div>
              <h1>제니스가 선별한 <span>Value</span>,<br/>그 가치를 보장합니다.</h1>
              <p className="hero-desc">
                창업사업 및 코스닥 기술특례상장 심의위원이 직접 선별·검증한 사업화 유망 특허만을 소개합니다.
                기술 매입·라이선스 상담 전 과정을 지원합니다.
              </p>
              <div className="stats-row">
                <div className="stat-card"><div className="stat-num">{patents.length}</div><div className="stat-label">등록 기술</div></div>
                <div className="stat-card"><div className="stat-num">{new Set(patents.map(p => p.org).filter(Boolean)).size}</div><div className="stat-label">참여 기관</div></div>
                <div className="stat-card"><div className="stat-num">{patents.filter(p => p.status === "완료").length}</div><div className="stat-label">이전 완료</div></div>
                <div className="stat-card"><div className="stat-num">{patents.filter(p => p.status === "협의중").length}</div><div className="stat-label">협의 진행</div></div>
              </div>
            </div>
          </section>
        )}

        <div className="content">
          {/* ─── BROWSE PAGE ─── */}
          {page === "browse" && (
            <>
              <div className="role-tabs">
                <button className={`role-tab ${role === "holder" ? "active" : ""}`} onClick={() => setRole("holder")}>
                  🏛 기술 보유자
                </button>
                <button className={`role-tab ${role === "buyer" ? "active" : ""}`} onClick={() => setRole("buyer")}>
                  🏢 수요 기업
                </button>
              </div>

              <div className="filters-bar">
                <div className="search-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    placeholder="기술명, 키워드로 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  {FIELDS.map(f => (
                    <button key={f} className={`filter-chip ${fieldFilter === f ? "active" : ""}`} onClick={() => setFieldFilter(f)}>{f}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-light)", lineHeight: "30px", marginRight: 4 }}>거래형태</span>
                {TYPES.map(t => (
                  <button key={t} className={`filter-chip ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>{t}</button>
                ))}
                <span style={{ fontSize: 12, color: "var(--text-light)", lineHeight: "30px", margin: "0 8px 0 16px" }}>상태</span>
                {STATUSES.map(s => (
                  <button key={s} className={`filter-chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s}</button>
                ))}
              </div>

              {patentsLoading ? (
                <div className="empty-state">
                  <p style={{ color: "var(--text-light)" }}>기술 목록을 불러오는 중입니다...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <p>{patents.length === 0 ? "아직 등록된 기술이 없습니다. 우측 상단 등록하기로 첫 번째 기술을 등록해주세요." : "검색 결과가 없습니다. 필터를 변경해 보세요."}</p>
                </div>
              ) : (
                <div className="patent-grid">
                  {filtered.map((p) => (
                    <div key={p.id} className="patent-card" onClick={() => setSelectedPatent(p)}>
                      <div className="card-top">
                        <div className="card-badges">
                          <Badge text={p.field} colors={fieldColors[p.field] || { bg: "#F1F5F9", text: "#475569" }} />
                          <Badge text={p.status} colors={statusColors[p.status]} />
                          <span className="badge" style={{ background: "var(--ivory)", color: "var(--text-mid)", border: "1px solid var(--border)" }}>
                            {p.type}
                          </span>
                        </div>
                        <div className="card-title">{p.title}</div>
                        <div className="card-summary">{p.summary}</div>
                        <TRLBar level={p.trl} />
                        <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: -8, marginBottom: 12 }}>
                          TRL {p.trl} / 9
                        </div>
                        <div className="card-meta-row">
                          <div className="meta-item">
                            <span className="meta-label">출원일</span>
                            <span className="meta-value">{p.filingDate || "-"}</span>
                          </div>
                          {p.examStatus && (
                            <>
                              <div className="meta-divider" />
                              <div className="meta-item">
                                <span className={`exam-badge ${p.examStatus === "등록완료" ? "registered" : "reviewing"}`}>
                                  <span className="dot" />
                                  {p.examStatus}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="meta-divider" />
                          <div className="meta-item">
                            <span className="meta-label">해외</span>
                            {p.overseas.length > 0 ? (
                              <div className="overseas-flags">
                                {p.overseas.map((c, i) => <span key={i} className="overseas-flag">{c}</span>)}
                              </div>
                            ) : (
                              <span className="overseas-none">국내만</span>
                            )}
                          </div>
                        </div>
                        <div className="card-keywords">
                          {p.keywords.map((k, i) => <span key={i} className="keyword">#{k}</span>)}
                        </div>
                      </div>
                      <div className="card-bottom">
                        <span className="card-org">{p.org}</span>
                        <span className="card-price">{p.price}</span>
                      </div>
                      {role === "buyer" && (
                        <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); setSelectedPatent(p); }}>
                          매입 의사 타진 →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── UPLOAD PAGE ─── */}
          {page === "upload" && (
            <div className="upload-page">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2>특허 등록 · SMK 생성</h2>
                  <p className="page-desc">
                    번호 입력 또는 PDF 업로드로 특허 정보를 가져오고 AI가 SMK를 자동 생성합니다.
                  </p>
                </div>
                {!adminAuth && (
                  <button onClick={() => { setAdminModal(true); setAdminPwError(""); setAdminPwInput(""); setAdminPwConfirm(""); setAdminSetupMode(!adminHasPassword); }}
                    style={{
                      background: "none", border: "1px solid var(--border)", width: 36, height: 36,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      fontSize: 15, color: "var(--text-light)", transition: "all .2s", flexShrink: 0, marginTop: 4
                    }}
                    title="관리자 설정"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </button>
                )}
                {adminAuth && (
                  <button onClick={() => { setAdminAuth(false); setSavePwPrompt(false); setSavePwInput(""); }}
                    style={{
                      background: "none", border: "1px solid #2d5a3e", width: 36, height: 36,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      fontSize: 15, color: "#2d5a3e", transition: "all .2s", flexShrink: 0, marginTop: 4
                    }}
                    title="관리자 잠금"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* KIPRIS API Key — admin only */}
              {adminAuth && (
              <div style={{
                background: "var(--white)", border: "1px solid var(--border)",
                padding: 18, marginBottom: 20
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: kiprisKeySaved && !showKeyInput ? 0 : 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-light)" }}>KIPRIS API</span>
                    {kiprisKeySaved && (
                      <span style={{ fontSize: 10, background: "#f0f5f1", color: "#2d5a3e", padding: "2px 8px", fontWeight: 600, letterSpacing: .5 }}>
                        ✓ 저장됨
                      </span>
                    )}
                  </div>
                  {kiprisKeySaved && !showKeyInput ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setShowKeyInput(true)} style={{
                        background: "none", border: "1px solid var(--border)", padding: "4px 12px",
                        fontSize: 10, color: "var(--text-mid)", cursor: "pointer", fontFamily: "'Sora',sans-serif",
                        letterSpacing: 1, textTransform: "uppercase"
                      }}>변경</button>
                      <button onClick={deleteKiprisKey} style={{
                        background: "none", border: "1px solid var(--border)", padding: "4px 12px",
                        fontSize: 10, color: "#6B1D2E", cursor: "pointer", fontFamily: "'Sora',sans-serif",
                        letterSpacing: 1, textTransform: "uppercase"
                      }}>삭제</button>
                    </div>
                  ) : null}
                </div>

                {kiprisKeySaved && !showKeyInput ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-mid)" }}>
                    <span style={{ fontFamily: "monospace", letterSpacing: 2 }}>
                      {"•".repeat(20)}{kiprisKey.slice(-6)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: savePwPrompt ? 10 : 0 }}>
                      <input
                        type="password"
                        placeholder="data.go.kr에서 발급받은 REST AccessKey 입력"
                        value={kiprisKeySaved ? "" : kiprisKey}
                        onChange={(e) => { setKiprisKey(e.target.value); setKiprisKeySaved(false); setSavePwPrompt(false); }}
                        style={{
                          flex: 1, minWidth: 240, padding: "10px 14px", border: "1px solid var(--border)",
                          fontSize: 13, fontFamily: "'Sora',sans-serif", outline: "none",
                          background: "var(--white)"
                        }}
                      />
                      {!savePwPrompt ? (
                        <button
                          onClick={() => { if(kiprisKey.trim()) setSavePwPrompt(true); }}
                          disabled={!kiprisKey.trim()}
                          style={{
                            background: kiprisKey.trim() ? "#6B1D2E" : "var(--border)",
                            color: kiprisKey.trim() ? "#fff" : "var(--text-light)",
                            border: "none", padding: "10px 20px", fontSize: 11, fontWeight: 600,
                            letterSpacing: 2, textTransform: "uppercase", cursor: kiprisKey.trim() ? "pointer" : "default",
                            fontFamily: "'Sora',sans-serif"
                          }}
                        >암호화 저장</button>
                      ) : null}
                      {showKeyInput && !savePwPrompt && (
                        <button onClick={() => setShowKeyInput(false)} style={{
                          background: "none", border: "1px solid var(--border)", padding: "10px 14px",
                          fontSize: 11, color: "var(--text-mid)", cursor: "pointer", fontFamily: "'Sora',sans-serif"
                        }}>취소</button>
                      )}
                    </div>
                    {savePwPrompt && (
                      <div style={{ background: "var(--ivory)", border: "1px solid var(--border)", padding: 14, marginTop: 2 }}>
                        <p style={{ fontSize: 11, color: "var(--text-mid)", marginBottom: 8 }}>
                          API 키를 AES-256으로 암호화합니다. 관리자 비밀번호를 입력하세요.
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="password"
                            placeholder="관리자 비밀번호"
                            value={savePwInput}
                            onChange={(e) => setSavePwInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveKiprisKey(kiprisKey)}
                            style={{
                              flex: 1, padding: "9px 12px", border: "1px solid var(--border)",
                              fontSize: 13, fontFamily: "'Sora',sans-serif", outline: "none"
                            }}
                          />
                          <button onClick={() => saveKiprisKey(kiprisKey)} style={{
                            background: "#6B1D2E", color: "#fff", border: "none", padding: "9px 16px",
                            fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                            cursor: "pointer", fontFamily: "'Sora',sans-serif"
                          }}>확인</button>
                          <button onClick={() => { setSavePwPrompt(false); setSavePwInput(""); }} style={{
                            background: "none", border: "1px solid var(--border)", padding: "9px 12px",
                            fontSize: 11, color: "var(--text-mid)", cursor: "pointer", fontFamily: "'Sora',sans-serif"
                          }}>취소</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!kiprisKeySaved && !kiprisKey && (
                  <p style={{ fontSize: 11, color: "var(--text-light)", marginTop: 8 }}>
                    한번 저장하면 다음 방문 시 관리자 인증으로 불러옵니다. AES-256-GCM으로 암호화되어 비밀번호 없이는 복호화가 불가능합니다.
                  </p>
                )}
              </div>
              )}

              {/* Mode Tabs */}
              <div className="role-tabs" style={{ marginBottom: 20 }}>
                <button className={`role-tab ${uploadMode === "number" ? "active" : ""}`} onClick={() => setUploadMode("number")}>
                  🔢 번호 입력
                </button>
                <button className={`role-tab ${uploadMode === "pdf" ? "active" : ""}`} onClick={() => setUploadMode("pdf")}>
                  📄 PDF 업로드
                </button>
              </div>

              {/* ── 번호 입력 모드 ── */}
              {uploadMode === "number" && (
                <div style={{
                  background: "var(--white)", border: "1px solid var(--border)", borderRadius: 0,
                  padding: 24, marginBottom: 4
                }}>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, fontWeight: 400, marginBottom: 4, color: "#1a1815" }}>특허 번호로 조회</div>
                  <p style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 18 }}>
                    출원번호, 공개번호, 또는 등록번호를 입력하면 KIPRIS에서 서지정보·도면·해외출원을 자동으로 가져옵니다.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div className="form-field" style={{ minWidth: 130 }}>
                      <label>번호 유형</label>
                      <select value={patentInputType} onChange={(e) => setPatentInputType(e.target.value)}
                        style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 0, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", background: "var(--white)" }}>
                        <option value="application">출원번호</option>
                        <option value="publication">공개번호</option>
                        <option value="registration">등록번호</option>
                      </select>
                    </div>
                    <div className="form-field" style={{ flex: 1, minWidth: 220 }}>
                      <label>번호 입력</label>
                      <input
                        placeholder={patentInputType === "application" ? "예: 10-2024-0012345" : patentInputType === "publication" ? "예: 10-2024-0123456" : "예: 10-2345678"}
                        value={patentInput}
                        onChange={(e) => setPatentInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleNumberSearch()}
                        style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 0, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", fontWeight: 600, letterSpacing: 0.5 }}
                      />
                    </div>
                    <button
                      onClick={handleNumberSearch}
                      disabled={smkLoading}
                      style={{
                        padding: "10px 28px", background: smkLoading ? "var(--text-light)" : "#6B1D2E",
                        color: "#fff", border: "none", fontSize: 11, fontWeight: 600,
                        cursor: smkLoading ? "not-allowed" : "pointer", fontFamily: "'Sora',sans-serif",
                        transition: "all .2s", height: 42, letterSpacing: 2, textTransform: "uppercase"
                      }}
                    >
                      조회
                    </button>
                  </div>
                </div>
              )}

              {/* ── PDF 업로드 모드 ── */}
              {uploadMode === "pdf" && (
                <div
                  className={`drop-zone ${dragOver ? "dragover" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="application/pdf" hidden
                    onChange={(e) => handleFile(e.target.files[0])} />
                  <div className="drop-zone-icon">📄</div>
                  <h3>{uploadedFile ? uploadedFile.name : "특허 명세서 PDF를 업로드하세요"}</h3>
                  <p>{uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB · 클릭하여 다시 업로드` : "드래그 앤 드롭 또는 클릭하여 선택"}</p>
                </div>
              )}

              {/* Step-by-step Loading */}
              {smkLoading && (
                <div style={{ marginTop: 28, background: "var(--white)", borderRadius: 0, border: "1px solid var(--border)", padding: 24 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    {(uploadMode === "number" ? [
                      { key: "kipris-bib", icon: "🔍", label: "서지정보" },
                      { key: "kipris-family", icon: "🌐", label: "해외출원" },
                      { key: "ai", icon: "🤖", label: "AI 분석" },
                      { key: "figures", icon: "🖼️", label: "도면 추출" },
                      { key: "merge", icon: "✨", label: "결과 병합" },
                    ] : [
                      { key: "pdf", icon: "📄", label: "PDF 읽기" },
                      { key: "ai", icon: "🤖", label: "AI 분석" },
                      { key: "figures", icon: "🖼️", label: "도면 추출" },
                      { key: "kipris-bib", icon: "🔍", label: "심사현황" },
                      { key: "kipris-family", icon: "🌐", label: "해외출원" },
                      { key: "merge", icon: "✨", label: "결과 병합" },
                    ]).map((step, i) => {
                      const steps = uploadMode === "number"
                        ? ["kipris-bib", "kipris-family", "ai", "figures", "merge"]
                        : ["pdf", "ai", "figures", "kipris-bib", "kipris-family", "merge"];
                      const currentIdx = steps.indexOf(loadingStep);
                      const stepIdx = steps.indexOf(step.key);
                      const isDone = stepIdx < currentIdx;
                      const isCurrent = step.key === loadingStep;
                      const isSkipped = uploadMode === "pdf" && !kiprisKey && (step.key === "kipris-bib" || step.key === "kipris-family");
                      return (
                        <div key={step.key} style={{
                          flex: 1, textAlign: "center", opacity: isSkipped ? 0.3 : 1,
                          position: "relative"
                        }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: "50%", margin: "0 auto 6px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18,
                            background: isDone ? "#f0f5f1" : isCurrent ? "var(--dark)" : "var(--ivory)",
                            border: isCurrent ? "2px solid #6B1D2E" : "2px solid transparent",
                            transition: "all .3s"
                          }}>
                            {isDone ? "✓" : step.icon}
                          </div>
                          <div style={{
                            fontSize: 11, fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? "var(--dark)" : isDone ? "#2d5a3e" : "var(--text-light)"
                          }}>
                            {isSkipped ? "건너뜀" : step.label}
                          </div>
                          {isCurrent && (
                            <div style={{ marginTop: 4 }}>
                              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: "0 auto" }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-mid)" }}>
                    {loadingStep === "pdf" && "PDF 파일을 읽고 있습니다..."}
                    {loadingStep === "ai" && "Claude AI가 명세서를 분석하여 SMK를 작성 중입니다..."}
                    {loadingStep === "figures" && "전문 PDF에서 도면을 추출하고 있습니다..."}
                    {loadingStep === "kipris-bib" && "KIPRIS에서 특허 서지정보를 조회하고 있습니다..."}
                    {loadingStep === "kipris-family" && "KIPRIS에서 해외 패밀리특허를 검색하고 있습니다..."}
                    {loadingStep === "merge" && "모든 데이터를 병합하고 있습니다..."}
                  </div>
                </div>
              )}

              {/* SMK Result */}
              {smkData && !smkLoading && (
                <div className="smk-result">
                  <div className="smk-card">
                    <div className="smk-header">
                      <h3>SMK 자동 생성 결과</h3>
                      <span>제니스특허법률사무소{smkData.kiprisLinked ? " · KIPRIS 연동" : ""}</span>
                    </div>
                    <div className="smk-tabs">
                      <button className={`smk-tab ${smkTab === "smk" ? "active" : ""}`} onClick={() => setSmkTab("smk")}>
                        📋 SMK 내용
                      </button>
                      <button className={`smk-tab ${smkTab === "legal" ? "active" : ""}`} onClick={() => setSmkTab("legal")}>
                        ⚖️ 특허 법률현황
                      </button>
                      <button className={`smk-tab ${smkTab === "pdf" ? "active" : ""}`} onClick={() => setSmkTab("pdf")}>
                        📄 명세서 전문
                      </button>
                    </div>
                    {smkTab === "smk" ? (
                      <div className="smk-body">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                          <div className="info-item"><div className="info-label">기술명</div><div className="info-value">{smkData.title}</div></div>
                          <div className="info-item"><div className="info-label">기술 분야</div><div className="info-value">{smkData.field}</div></div>
                          <div className="info-item"><div className="info-label">TRL</div><div className="info-value">Level {smkData.trl}</div></div>
                          <div className="info-item"><div className="info-label">특허번호</div><div className="info-value">{smkData.patentNo}</div></div>
                          <div className="info-item"><div className="info-label">발명자</div><div className="info-value">{smkData.inventor}</div></div>
                          <div className="info-item"><div className="info-label">출원기관</div><div className="info-value">{smkData.org}</div></div>
                        </div>
                        <div className="smk-field"><label>기술 개요</label><p>{smkData.summary}</p></div>
                        <div className="smk-field"><label>핵심 기술 내용</label><p>{smkData.core}</p></div>
                        <div className="smk-field"><label>특징 및 장점</label><p>{smkData.advantage}</p></div>
                        <div className="smk-field"><label>활용 분야</label><p>{smkData.application}</p></div>
                        <div className="smk-field"><label>기대 효과</label><p>{smkData.effect}</p></div>
                        <div className="smk-field">
                          <label>핵심 키워드</label>
                          <div className="tags">
                            {(smkData.keywords || []).map((k, i) => <span key={i} className="tag">{k}</span>)}
                          </div>
                        </div>

                        {/* 도면 */}
                        {(() => {
                          const figsWithImg = (smkData?.figures || []).filter(f => f && f.imageUrl);
                          if (figsWithImg.length === 0) return null;
                          return (
                            <div className="smk-field">
                              <label>도면</label>
                              <div className="figures-grid" style={{ marginTop: 8 }}>
                                {figsWithImg.map((fig, i) => (
                                  <div key={i} className="figure-card">
                                    <div className="figure-thumb">
                                      <img src={fig.imageUrl} alt={fig.title} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                                    </div>
                                    <div className="figure-info">
                                      <div className="figure-title">{fig.title}</div>
                                      {fig.desc && <div className="figure-desc">{fig.desc}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <button className="smk-register-btn" onClick={openCategoryConfirm}>
                          플랫폼 등록 신청
                        </button>
                        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-light)", marginTop: 8 }}>
                          * /admin 에서 먼저 로그인한 후 이 버튼을 눌러주세요. 등록된 특허는 메인 페이지에 즉시 공개됩니다.
                        </p>
                      </div>
                    ) : smkTab === "legal" ? (
                      <div className="smk-body">
                        {/* 특허 법률현황 — KIPRIS 데이터 */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                          <div className="info-item">
                            <div className="info-label">출원번호</div>
                            <div className="info-value">{smkData.patentNo}</div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">출원일</div>
                            <div className="info-value">{smkData.filingDate || "-"}</div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">심사 현황</div>
                            <div className="info-value">
                              <span className={`exam-badge ${smkData.examStatus === "등록완료" ? "registered" : "reviewing"}`}>
                                <span className="dot" />
                                {smkData.examStatus}
                              </span>
                            </div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">등록번호</div>
                            <div className="info-value">{smkData.registrationNumber || "-"}</div>
                          </div>
                          {smkData.registrationDate && (
                            <div className="info-item">
                              <div className="info-label">등록일</div>
                              <div className="info-value">{smkData.registrationDate}</div>
                            </div>
                          )}
                        </div>

                        {/* 해외출원 현황 */}
                        <div style={{
                          background: "var(--ivory)", borderRadius: 0, padding: 20, marginBottom: 16
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            🌐 해외 출원 현황
                            {smkData.kiprisLinked && (
                              <span style={{ fontSize: 10, background: "#f0f5f1", color: "#2d5a3e", padding: "2px 8px", borderRadius: 0, fontWeight: 600 }}>
                                KIPRIS 자동 조회
                              </span>
                            )}
                          </div>
                          {smkData.overseas && smkData.overseas.length > 0 ? (
                            <>
                              <div className="overseas-flags" style={{ gap: 6, marginBottom: 12 }}>
                                {smkData.overseas.map((c, i) => (
                                  <span key={i} className="overseas-flag" style={{ padding: "4px 12px", fontSize: 12 }}>{c}</span>
                                ))}
                              </div>
                              {smkData.overseasDetail && smkData.overseasDetail.length > 0 && (
                                <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.8 }}>
                                  {smkData.overseasDetail.map((f, i) => (
                                    <div key={i}>
                                      <span style={{ fontWeight: 600 }}>{f.countryCode}</span>
                                      {f.countryName && <span> ({f.countryName})</span>}
                                      {f.applicationNo && <span> — {f.applicationNo}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                              {smkData.kiprisLinked
                                ? "해외 패밀리특허가 검색되지 않았습니다. (국내 출원만 확인됨)"
                                : "KIPRIS API 키를 입력하면 해외 출원 현황이 자동으로 조회됩니다."}
                            </p>
                          )}
                        </div>

                        {!smkData.kiprisLinked && (
                          <div style={{
                            background: "#faf0f2", border: "1px solid #e8d0d5", borderRadius: 0,
                            padding: 14, fontSize: 12, color: "#6B1D2E", lineHeight: 1.6
                          }}>
                            💡 KIPRIS API 키가 입력되지 않아 심사현황·해외출원 조회를 건너뛰었습니다.
                            상단에 data.go.kr 인증키를 입력 후 다시 업로드하면 자동으로 연동됩니다.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {smkData?.fullTextXml ? (
                          <div style={{
                            maxHeight: 500, overflowY: "auto", padding: "20px 24px",
                            border: "1px solid var(--border)", background: "var(--white)",
                            fontSize: 13, lineHeight: 1.9, color: "var(--text-mid)",
                            fontFamily: "'Noto Sans KR', sans-serif"
                          }}>
                            {smkData.fullTextXml.split('\n').map((line, i) => {
                              const trimmed = line.trim();
                              if (!trimmed) return <br key={i} />;
                              // 섹션 제목 (기술분야, 발명의 내용, 도면의 간단한 설명, 청구항 등)
                              const isSection = /^(\[|【)?.*(기술\s*분야|배경\s*기술|발명의\s*(내용|배경)|해결하려는\s*과제|과제의\s*해결|발명의\s*효과|도면의\s*간단한\s*설명|발명을\s*실시하기|실시예|청구의\s*범위|산업상\s*이용)/.test(trimmed);
                              const isFigRef = /^\[?\s*도\s*\d+/.test(trimmed);
                              const isClaim = /^\[?\s*청구항\s*\d+/.test(trimmed);
                              if (isSection) return (
                                <div key={i} style={{ fontWeight: 700, color: "var(--dark)", fontSize: 14, marginTop: 18, marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 4 }}>
                                  {trimmed}
                                </div>
                              );
                              if (isFigRef) return (
                                <div key={i} style={{ color: "#6B1D2E", fontWeight: 600, marginTop: 4 }}>{trimmed}</div>
                              );
                              if (isClaim) return (
                                <div key={i} style={{ fontWeight: 600, color: "var(--dark)", marginTop: 10 }}>{trimmed}</div>
                              );
                              return <p key={i} style={{ margin: "2px 0" }}>{trimmed}</p>;
                            })}
                          </div>
                        ) : pdfUrl ? (
                          <iframe src={pdfUrl} className="pdf-viewer" title="Patent PDF" />
                        ) : (
                          <div className="pdf-viewer" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-light)", fontSize: 13 }}>
                            전문 파일이 없습니다. 공개 또는 등록되지 않은 출원일 수 있습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── PROCESS PAGE ─── */}
          {page === "process" && (
            <div className="process-page">
              <h2>기술이전 거래 절차</h2>
              <p className="page-desc">제니스특허법률사무소가 전 과정을 지원합니다. 각 단계별 역할을 확인하세요.</p>

              <div className="process-timeline">
                <div className="process-line" />
                {[
                  {
                    num: 1, title: "기술 등록", color: "#6B1D2E",
                    desc: "대학·연구소가 특허 명세서를 업로드하면, AI가 SMK를 자동 생성합니다. 변리사가 검토 후 플랫폼에 게시합니다.",
                    roles: [{ label: "보유자", cls: "role-holder" }, { label: "변리사", cls: "role-attorney" }]
                  },
                  {
                    num: 2, title: "기술 탐색 · 관심 표현", color: "#8a2e42",
                    desc: "기업이 플랫폼에서 기술을 검색·탐색하고, 관심 있는 기술에 매입 의사를 타진합니다.",
                    roles: [{ label: "수요기업", cls: "role-buyer" }]
                  },
                  {
                    num: 3, title: "NDA 체결 · 기술 실사", color: "#1a1815",
                    desc: "비밀유지계약(NDA)을 체결하고, 상세 기술 자료를 공개합니다. 필요시 기술 실사를 진행합니다.",
                    roles: [{ label: "보유자", cls: "role-holder" }, { label: "수요기업", cls: "role-buyer" }, { label: "변리사", cls: "role-attorney" }]
                  },
                  {
                    num: 4, title: "조건 협상", color: "#2a2520",
                    desc: "거래 형태(매각·라이선스·기술지도 등), 대가, 로열티율, 기술지원 범위 등 세부 조건을 협상합니다.",
                    roles: [{ label: "보유자", cls: "role-holder" }, { label: "수요기업", cls: "role-buyer" }, { label: "변리사", cls: "role-attorney" }]
                  },
                  {
                    num: 5, title: "계약 체결 · 기술이전", color: "#3a3530",
                    desc: "기술이전 계약서를 작성·체결하고, 특허권 이전 또는 실시권 설정 등 법적 절차를 완료합니다.",
                    roles: [{ label: "보유자", cls: "role-holder" }, { label: "수요기업", cls: "role-buyer" }, { label: "변리사", cls: "role-attorney" }]
                  },
                ].map((step) => (
                  <div key={step.num} className="process-step">
                    <div className="step-num" style={{ background: step.color }}>{step.num}</div>
                    <div className="step-content">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                      <div className="step-roles">
                        {step.roles.map((r, i) => (
                          <span key={i} className={`role-badge ${r.cls}`}>{r.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-name">Zenithvalue</div>
              <div className="footer-info">
                제니스특허법률사무소 IP 거래 플랫폼<br/>
                <a href="https://z-ipvalue.com" target="_blank" rel="noopener">z-ipvalue.com</a>
                <span style={{ margin: "0 6px", color: "var(--text-lighter)" }}>·</span>
                법률 지원: <a href="https://ipzenith.com" target="_blank" rel="noopener">제니스특허법률사무소 (ipzenith.com)</a>
              </div>
            </div>
            <div className="footer-right">
              © 2026 Zenithvalue
            </div>
          </div>
        </footer>

        {/* 카테고리·거래형태 확인 모달 (플랫폼 등록 신청 시) */}
        {categoryConfirm && (
          <div className="modal-overlay" onClick={() => setCategoryConfirm(null)} style={{ zIndex: 200 }}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 480, padding: 0 }}
            >
              <div style={{ padding: "24px 28px 0" }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--dark)" }}>
                  플랫폼 등록 확인
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-mid)", margin: "8px 0 0", lineHeight: 1.6 }}>
                  AI가 분석한 결과를 검토해주세요. 저장 전에 카테고리와 거래형태를 최종 확인할 수 있습니다.
                </p>
              </div>

              <div style={{ padding: "20px 28px", borderTop: "1px solid var(--border)", marginTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-light)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                    AI 추정 분야
                  </label>
                  <div style={{ fontSize: 13, color: "var(--text-mid)", padding: "8px 12px", background: "var(--ivory)", borderRadius: 0 }}>
                    {categoryConfirm.suggested}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-light)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                    플랫폼 카테고리 <span style={{ color: "var(--oxblood)" }}>*</span>
                  </label>
                  <select
                    value={categoryConfirm.selected}
                    onChange={(e) => setCategoryConfirm({ ...categoryConfirm, selected: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 12px", fontSize: 14,
                      border: "1px solid var(--border)", borderRadius: 0, background: "white",
                      fontFamily: "inherit", outline: "none"
                    }}
                  >
                    {["AI/SW", "바이오", "소재", "에너지", "전자", "환경"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-light)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                    거래형태 <span style={{ color: "var(--oxblood)" }}>*</span>
                  </label>
                  <select
                    value={categoryConfirm.dealType}
                    onChange={(e) => setCategoryConfirm({ ...categoryConfirm, dealType: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 12px", fontSize: 14,
                      border: "1px solid var(--border)", borderRadius: 0, background: "white",
                      fontFamily: "inherit", outline: "none"
                    }}
                  >
                    <option value="라이선스/매각">라이선스/매각 (둘 다 가능)</option>
                    <option value="라이선스">라이선스만</option>
                    <option value="매각">매각만</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: "16px 28px 24px", display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => setCategoryConfirm(null)}
                  style={{
                    padding: "10px 20px", background: "white", color: "var(--text-mid)",
                    border: "1px solid var(--border)", fontSize: 13, cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  취소
                </button>
                <button
                  onClick={saveSmkToSupabase}
                  style={{
                    padding: "10px 20px", background: "var(--oxblood)", color: "white",
                    border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", letterSpacing: 0.5
                  }}
                >
                  이 설정으로 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedPatent && (
          <div className="modal-overlay" onClick={() => setSelectedPatent(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <Badge text={selectedPatent.field} colors={fieldColors[selectedPatent.field] || { bg: "#F1F5F9", text: "#475569" }} />
                    <Badge text={selectedPatent.status} colors={statusColors[selectedPatent.status]} />
                    <span className="badge" style={{ background: "var(--ivory)", color: "var(--text-mid)", border: "1px solid var(--border)" }}>
                      {selectedPatent.type}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, fontWeight: 400 }}>{selectedPatent.title}</h2>
                </div>
                <button className="modal-close" onClick={() => setSelectedPatent(null)}>✕</button>
              </div>
              <div className="modal-body">
                {/* Compact info grid — 3 columns */}
                <div className="info-grid">
                  <div className="info-item"><div className="info-label">출원번호</div><div className="info-value">{selectedPatent.patentNo}</div></div>
                  <div className="info-item"><div className="info-label">출원일</div><div className="info-value">{selectedPatent.filingDate}</div></div>
                  <div className="info-item">
                    <div className="info-label">심사 현황</div>
                    <div className="info-value">
                      {selectedPatent.examStatus ? (
                        <span className={`exam-badge ${selectedPatent.examStatus === "등록완료" ? "registered" : "reviewing"}`}>
                          <span className="dot" />{selectedPatent.examStatus}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-light)" }}>미확인</span>
                      )}
                    </div>
                  </div>
                  <div className="info-item"><div className="info-label">발명자</div><div className="info-value">{selectedPatent.inventor}</div></div>
                  <div className="info-item"><div className="info-label">출원기관</div><div className="info-value">{selectedPatent.org}</div></div>
                  <div className="info-item"><div className="info-label">TRL</div><div className="info-value">Level {selectedPatent.trl} / 9</div></div>
                  <div className="info-item"><div className="info-label">거래형태</div><div className="info-value">{selectedPatent.type}</div></div>
                  <div className="info-item"><div className="info-label">희망가</div><div className="info-value" style={{ color: "var(--oxblood)" }}>{selectedPatent.price}</div></div>
                  <div className="info-item">
                    <div className="info-label">해외 출원</div>
                    <div className="info-value">
                      {selectedPatent.overseas.length > 0 ? (
                        <div className="overseas-flags" style={{ gap: 3 }}>
                          {selectedPatent.overseas.map((c, i) => <span key={i} className="overseas-flag" style={{ fontSize: 10, padding: "1px 6px" }}>{c}</span>)}
                        </div>
                      ) : <span style={{ fontSize: 12, color: "var(--text-light)" }}>국내만</span>}
                    </div>
                  </div>
                  {selectedPatent.registrationNumber && (
                    <div className="info-item"><div className="info-label">등록번호</div><div className="info-value">{selectedPatent.registrationNumber}</div></div>
                  )}
                  {selectedPatent.registrationDate && (
                    <div className="info-item"><div className="info-label">등록일</div><div className="info-value">{selectedPatent.registrationDate}</div></div>
                  )}
                  {selectedPatent.publicationNumber && (
                    <div className="info-item"><div className="info-label">공개번호</div><div className="info-value">{selectedPatent.publicationNumber}</div></div>
                  )}
                </div>

                {/* 기술 개요 + 상세 — 2열 병렬 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div className="modal-section" style={{ margin: 0 }}>
                    <h4>기술 개요</h4>
                    <p>{selectedPatent.summary}</p>
                  </div>
                  <div className="modal-section" style={{ margin: 0 }}>
                    <h4>기술 상세</h4>
                    <p>{selectedPatent.detail}</p>
                  </div>
                </div>

                {/* 도면 섹션 — 이미지가 있는 도면만 표시 */}
                {(() => {
                  const figuresWithImg = (selectedPatent.figures || []).filter(f => f && f.imageUrl);
                  if (figuresWithImg.length === 0) return null;
                  return (
                    <div className="figures-section">
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        도면
                      </h4>
                      <div className="figures-grid">
                        {figuresWithImg.map((fig, i) => (
                          <div key={i} className="figure-card">
                            <div className="figure-thumb">
                              <img src={fig.imageUrl} alt={fig.title} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                            </div>
                            <div className="figure-info">
                              <div className="figure-title">{fig.title}</div>
                              {fig.desc && <div className="figure-desc">{fig.desc}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 키워드 — 인라인 */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
                  {selectedPatent.keywords.map((k, i) => (
                    <span key={i} className="keyword" style={{ fontSize: 11, padding: "4px 10px" }}>#{k}</span>
                  ))}
                </div>

                {role === "buyer" && (
                  <div className="inquiry-form">
                    <h3>매입 의사 타진 · 기술이전 문의</h3>
                    <p className="form-sub">작성 후 접수하면 제니스특허법률사무소({FIRM_EMAIL})로 이메일이 발송됩니다.</p>
                    <div className="form-row">
                      <div className="form-field">
                        <label>회사명</label>
                        <input placeholder="회사명을 입력하세요" value={inquiryForm.company} onChange={(e) => updateInquiry("company", e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label>담당자명</label>
                        <input placeholder="담당자 성명" value={inquiryForm.name} onChange={(e) => updateInquiry("name", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label>연락처</label>
                        <input placeholder="이메일 또는 전화번호" value={inquiryForm.contact} onChange={(e) => updateInquiry("contact", e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label>희망 거래 형태</label>
                        <select value={inquiryForm.dealType} onChange={(e) => updateInquiry("dealType", e.target.value)}>
                          <option value="">선택하세요</option>
                          <option>특허매입</option>
                          <option>전용실시권</option>
                          <option>통상실시권</option>
                          <option>기술지도 포함</option>
                          <option>기타 (하단 기재)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>문의 내용</label>
                      <textarea placeholder="관심 사유, 활용 계획, 추가 문의 사항 등을 자유롭게 작성해주세요." value={inquiryForm.message} onChange={(e) => updateInquiry("message", e.target.value)} />
                    </div>
                    <button className="form-submit" onClick={() => {
                      if (!inquiryForm.company || !inquiryForm.name || !inquiryForm.contact) {
                        showToast("회사명, 담당자명, 연락처를 모두 입력해주세요.");
                        return;
                      }
                      sendInquiryEmail("buyer");
                    }}>
                      📧 이메일로 문의 접수
                    </button>
                  </div>
                )}

                {role === "holder" && (
                  <div style={{ background: "var(--ivory)", borderRadius: 0, padding: 20, marginTop: 20, textAlign: "center" }}>
                    <p style={{ fontSize: 14, color: "var(--text-mid)", marginBottom: 4 }}>
                      이 기술의 이전 상담을 받고 싶으시면 아래 버튼을 클릭하세요.
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 14 }}>
                      제니스특허법률사무소({FIRM_EMAIL})로 상담 신청 이메일이 작성됩니다.
                    </p>
                    <button className="form-submit" style={{ maxWidth: 320, margin: "0 auto" }}
                      onClick={() => sendInquiryEmail("holder")}>
                      📧 기술이전 상담 신청
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Login Modal */}
        {adminModal && (
          <div className="modal-overlay" onClick={() => { setAdminModal(false); setResetStep(0); }}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, fontWeight: 400 }}>
                    {resetStep > 0 ? "마스터 리셋" : adminSetupMode ? "관리자 비밀번호 설정" : "관리자 인증"}
                  </h2>
                </div>
                <button className="modal-close" onClick={() => { setAdminModal(false); setResetStep(0); }}>✕</button>
              </div>
              <div className="modal-body">
                {resetStep === 0 ? (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 20, lineHeight: 1.6 }}>
                      {adminSetupMode
                        ? "KIPRIS API 키 등 관리자 설정에 접근하기 위한 비밀번호를 설정하세요."
                        : "관리자 설정에 접근하려면 비밀번호를 입력하세요."}
                    </p>
                    <div className="form-field" style={{ marginBottom: 12 }}>
                      <label>{adminSetupMode ? "새 비밀번호" : "비밀번호"}</label>
                      <input
                        type="password"
                        placeholder={adminSetupMode ? "6자 이상 입력" : "관리자 비밀번호"}
                        value={adminPwInput}
                        onChange={(e) => { setAdminPwInput(e.target.value); setAdminPwError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (adminSetupMode ? null : handleAdminLogin())}
                        style={{ padding: "12px 14px", border: "1px solid var(--border)", fontSize: 14, fontFamily: "'Sora',sans-serif", outline: "none", width: "100%" }}
                      />
                    </div>
                    {adminSetupMode && (
                      <div className="form-field" style={{ marginBottom: 12 }}>
                        <label>비밀번호 확인</label>
                        <input
                          type="password"
                          placeholder="비밀번호 다시 입력"
                          value={adminPwConfirm}
                          onChange={(e) => { setAdminPwConfirm(e.target.value); setAdminPwError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                          style={{ padding: "12px 14px", border: "1px solid var(--border)", fontSize: 14, fontFamily: "'Sora',sans-serif", outline: "none", width: "100%" }}
                        />
                      </div>
                    )}
                    {adminPwError && (
                      <p style={{ fontSize: 12, color: "#6B1D2E", marginBottom: 12, background: "#faf0f2", padding: "8px 12px", border: "1px solid #e8d0d5" }}>
                        {adminPwError}
                      </p>
                    )}
                    <button className="form-submit" onClick={handleAdminLogin}>
                      {adminSetupMode ? "비밀번호 설정" : "인증"}
                    </button>
                    {!adminSetupMode && adminHasPassword && (
                      <button onClick={() => setResetStep(1)} style={{
                        background: "none", border: "none", color: "var(--text-light)", fontSize: 12,
                        cursor: "pointer", marginTop: 14, width: "100%", textAlign: "center",
                        fontFamily: "'Sora',sans-serif", letterSpacing: .3
                      }}>
                        비밀번호를 잊으셨나요?
                      </button>
                    )}
                  </>
                ) : resetStep === 1 ? (
                  <>
                    <div style={{ background: "#faf0f2", border: "1px solid #e8d0d5", padding: 18, marginBottom: 18 }}>
                      <p style={{ fontSize: 13, color: "#6B1D2E", fontWeight: 600, marginBottom: 8 }}>
                        마스터 리셋 경고
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7 }}>
                        비밀번호와 저장된 KIPRIS API 키가 <strong>모두 삭제</strong>됩니다.
                        초기화 후 비밀번호를 다시 설정하고, API 키도 다시 입력해야 합니다.
                        이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setResetStep(2)} style={{
                        flex: 1, background: "#6B1D2E", color: "#fff", border: "none", padding: "12px",
                        fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                        cursor: "pointer", fontFamily: "'Sora',sans-serif"
                      }}>초기화 진행</button>
                      <button onClick={() => setResetStep(0)} style={{
                        flex: 1, background: "none", border: "1px solid var(--border)", padding: "12px",
                        fontSize: 12, color: "var(--text-mid)", cursor: "pointer", fontFamily: "'Sora',sans-serif"
                      }}>돌아가기</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 16, lineHeight: 1.6 }}>
                      정말 초기화하시겠습니까? 아래 버튼을 누르면 즉시 실행됩니다.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={masterReset} style={{
                        flex: 1, background: "#6B1D2E", color: "#fff", border: "none", padding: "12px",
                        fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                        cursor: "pointer", fontFamily: "'Sora',sans-serif"
                      }}>최종 확인 — 전체 초기화</button>
                      <button onClick={() => setResetStep(0)} style={{
                        flex: 1, background: "none", border: "1px solid var(--border)", padding: "12px",
                        fontSize: 12, color: "var(--text-mid)", cursor: "pointer", fontFamily: "'Sora',sans-serif"
                      }}>취소</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

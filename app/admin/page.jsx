'use client';

// app/admin/page.jsx
// z-ipvalue 관리자 페이지 (v2 - 기존 UI 필드 호환)

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['AI/SW', '바이오', '소재', '에너지', '전자', '환경'];
const DEAL_TYPES = ['라이선스', '매각'];
const STATUSES = ['공개', '협의중', '완료'];
const EXAM_STATUSES = ['심사중', '등록완료'];

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patents, setPatents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatent, setEditingPatent] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchPatents();
  }, [session]);

  async function fetchPatents() {
    const { data, error } = await supabase
      .from('patents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert('특허 목록을 불러올 수 없습니다: ' + error.message);
    } else {
      setPatents(data || []);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleDelete(id, title) {
    if (!confirm(`"${title}" 을(를) 정말 삭제하시겠어요?\n되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from('patents').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchPatents();
  }

  async function togglePublished(patent) {
    const { error } = await supabase
      .from('patents')
      .update({ is_published: !patent.is_published })
      .eq('id', patent.id);
    if (error) alert('상태 변경 실패: ' + error.message);
    else fetchPatents();
  }

  if (loading) return <div style={styles.center}>로딩 중...</div>;
  if (!session) return <LoginForm />;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>z-ipvalue 관리자</h1>
          <p style={styles.subtitle}>제니스특허법률사무소 · IP 기술이전 플랫폼</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.email}>{session.user.email}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
        </div>
      </header>

      <div style={styles.actions}>
        <button onClick={() => { setEditingPatent(null); setShowForm(true); }} style={styles.primaryBtn}>
          + 새 특허 등록
        </button>
        <span style={styles.count}>총 {patents.length}건</span>
      </div>

      {showForm && (
        <PatentForm
          patent={editingPatent}
          onClose={(didSave) => {
            setShowForm(false);
            setEditingPatent(null);
            if (didSave) fetchPatents();
          }}
        />
      )}

      <PatentList
        patents={patents}
        onEdit={(p) => { setEditingPatent(p); setShowForm(true); }}
        onDelete={handleDelete}
        onTogglePublished={togglePublished}
      />
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('로그인 실패: ' + error.message);
    setLoading(false);
  }

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <h1 style={styles.loginTitle}>z-ipvalue 관리자</h1>
        <p style={styles.loginSubtitle}>제니스특허법률사무소 IP 기술이전 플랫폼</p>
        <form onSubmit={handleLogin}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required style={styles.input} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required style={styles.input} />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.loginBtn}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PatentList({ patents, onEdit, onDelete, onTogglePublished }) {
  if (patents.length === 0) {
    return (
      <div style={styles.empty}>
        등록된 특허가 없습니다.<br />
        "+ 새 특허 등록" 버튼을 눌러 첫 번째 특허를 등록하세요.
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>기술명</th>
            <th style={styles.th}>분야</th>
            <th style={styles.th}>거래</th>
            <th style={styles.th}>상태</th>
            <th style={styles.th}>보유기관</th>
            <th style={styles.th}>발명자</th>
            <th style={styles.th}>희망가</th>
            <th style={styles.th}>공개</th>
            <th style={styles.th}>작업</th>
          </tr>
        </thead>
        <tbody>
          {patents.map((p) => (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div style={styles.tdSub}>
                  {p.description?.slice(0, 60)}{p.description?.length > 60 ? '…' : ''}
                </div>
              </td>
              <td style={styles.td}>{p.category}</td>
              <td style={styles.td}>{p.deal_type}</td>
              <td style={styles.td}><Badge status={p.status} /></td>
              <td style={styles.td}>{p.holder || '-'}</td>
              <td style={styles.td}>{p.inventor || '-'}</td>
              <td style={styles.td}>{p.price_display || '-'}</td>
              <td style={styles.td}>
                <button onClick={() => onTogglePublished(p)} style={styles.toggleBtn}>
                  {p.is_published ? '✅ 공개' : '⚪ 비공개'}
                </button>
              </td>
              <td style={styles.td}>
                <button onClick={() => onEdit(p)} style={styles.editBtn}>수정</button>
                <button onClick={() => onDelete(p.id, p.title)} style={styles.deleteBtn}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ status }) {
  const colors = {
    '공개': { bg: '#f9fafb', fg: '#6b7280' },
    '협의중': { bg: '#fdf6ec', fg: '#8a6d2b' },
    '완료': { bg: '#f0f5f1', fg: '#2d5a3e' },
  };
  const c = colors[status] || { bg: '#f3f4f6', fg: '#374151' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

function PatentForm({ patent, onClose }) {
  const [form, setForm] = useState(patent || {
    title: '', description: '', detail: '',
    category: 'AI/SW', deal_type: '라이선스', status: '공개',
    trl_level: null, application_date: '', application_no: '', registration_no: '',
    examination_status: '', foreign_countries: [], tags: [],
    holder: '', inventor: '', price_display: '', contact_email: '',
    is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState(patent?.tags?.join(', ') || '');
  const [countriesInput, setCountriesInput] = useState(patent?.foreign_countries?.join(', ') || '');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      foreign_countries: countriesInput.split(',').map((c) => c.trim()).filter(Boolean),
      trl_level: form.trl_level ? parseInt(form.trl_level) : null,
      application_date: form.application_date || null,
    };
    ['application_no', 'registration_no', 'examination_status', 'holder', 'inventor', 'price_display', 'contact_email', 'description', 'detail'].forEach((k) => {
      if (data[k] === '') data[k] = null;
    });
    delete data.figures;
    delete data.likes;

    let error;
    if (patent) {
      delete data.created_at;
      delete data.updated_at;
      ({ error } = await supabase.from('patents').update(data).eq('id', patent.id));
    } else {
      delete data.id;
      delete data.created_at;
      delete data.updated_at;
      ({ error } = await supabase.from('patents').insert([data]));
    }
    setSaving(false);
    if (error) alert('저장 실패: ' + error.message);
    else onClose(true);
  }

  return (
    <div style={styles.modalOverlay} onClick={() => onClose(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>{patent ? '특허 수정' : '새 특허 등록'}</h2>
        <form onSubmit={handleSubmit}>
          <SectionTitle>기본 정보</SectionTitle>

          <FormRow label="기술명" required>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required style={styles.input} placeholder="예: 그래핀 기반 고효율 방열 복합소재" />
          </FormRow>

          <FormRow label="요약 설명 (카드에 표시, 2~3줄)">
            <textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={3} style={{ ...styles.input, resize: 'vertical' }} placeholder="기술의 핵심 내용과 적용 분야를 간결히 작성" />
          </FormRow>

          <FormRow label="상세 설명 (상세 모달에 표시)">
            <textarea value={form.detail || ''} onChange={(e) => update('detail', e.target.value)} rows={5} style={{ ...styles.input, resize: 'vertical' }} placeholder="기술의 자세한 내용, 효과, 성능 지표 등 구체적으로 작성" />
          </FormRow>

          <div style={styles.row3}>
            <FormRow label="카테고리" required>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} style={styles.input}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormRow>
            <FormRow label="거래형태" required>
              <select value={form.deal_type} onChange={(e) => update('deal_type', e.target.value)} style={styles.input}>
                {DEAL_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormRow>
            <FormRow label="진행상태" required>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} style={styles.input}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormRow>
          </div>

          <SectionTitle>특허 정보</SectionTitle>
          <div style={styles.row3}>
            <FormRow label="TRL 레벨">
              <select value={form.trl_level || ''} onChange={(e) => update('trl_level', e.target.value || null)} style={styles.input}>
                <option value="">선택안함</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>TRL {n}</option>)}
              </select>
            </FormRow>
            <FormRow label="심사상태">
              <select value={form.examination_status || ''} onChange={(e) => update('examination_status', e.target.value)} style={styles.input}>
                <option value="">선택안함</option>
                {EXAM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormRow>
            <FormRow label="출원일">
              <input type="date" value={form.application_date || ''} onChange={(e) => update('application_date', e.target.value)} style={styles.input} />
            </FormRow>
          </div>

          <div style={styles.row2}>
            <FormRow label="출원번호">
              <input type="text" value={form.application_no || ''} onChange={(e) => update('application_no', e.target.value)} placeholder="10-2024-0012345" style={styles.input} />
            </FormRow>
            <FormRow label="등록번호">
              <input type="text" value={form.registration_no || ''} onChange={(e) => update('registration_no', e.target.value)} placeholder="10-2345678" style={styles.input} />
            </FormRow>
          </div>

          <FormRow label="해외출원국 (쉼표로 구분)">
            <input type="text" value={countriesInput} onChange={(e) => setCountriesInput(e.target.value)} placeholder="PCT, US, JP, CN, EP" style={styles.input} />
          </FormRow>

          <FormRow label="해시태그 (쉼표로 구분)">
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="그래핀, 방열, 복합소재" style={styles.input} />
          </FormRow>

          <SectionTitle>출원인 · 거래 정보</SectionTitle>
          <div style={styles.row2}>
            <FormRow label="보유기관">
              <input type="text" value={form.holder || ''} onChange={(e) => update('holder', e.target.value)} placeholder="한국과학기술원" style={styles.input} />
            </FormRow>
            <FormRow label="발명자">
              <input type="text" value={form.inventor || ''} onChange={(e) => update('inventor', e.target.value)} placeholder="김정호 교수" style={styles.input} />
            </FormRow>
          </div>

          <div style={styles.row2}>
            <FormRow label="희망가 (자유 입력)">
              <input type="text" value={form.price_display || ''} onChange={(e) => update('price_display', e.target.value)} placeholder="5,000만원 / 1억원~ / 협의 후 결정" style={styles.input} />
            </FormRow>
            <FormRow label="문의 이메일">
              <input type="email" value={form.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} placeholder="info@ipzenith.co.kr" style={styles.input} />
            </FormRow>
          </div>

          <FormRow label="">
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} />
              <span>메인 페이지에 공개</span>
            </label>
          </FormRow>

          <div style={styles.modalActions}>
            <button type="button" onClick={() => onClose(false)} style={styles.cancelBtn}>취소</button>
            <button type="submit" disabled={saving} style={styles.primaryBtn}>
              {saving ? '저장 중...' : patent ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={styles.sectionTitle}>{children}</h3>;
}

function FormRow({ label, required, children }) {
  return (
    <div style={styles.formRow}>
      {label && <label style={styles.label}>{label}{required && <span style={{ color: '#e11d48' }}> *</span>}</label>}
      {children}
    </div>
  );
}

const styles = {
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6b7280' },
  container: { maxWidth: 1280, margin: '0 auto', padding: '32px 24px', fontFamily: '-apple-system, "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', color: '#111827' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  email: { fontSize: 13, color: '#6b7280' },
  logoutBtn: { padding: '6px 12px', fontSize: 13, background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', color: '#374151' },
  actions: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  count: { fontSize: 14, color: '#6b7280' },
  primaryBtn: { padding: '10px 20px', background: '#6B1D2E', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer' },
  empty: { padding: '80px 24px', textAlign: 'center', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: 8, lineHeight: 1.8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { padding: '12px 8px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: 13 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '14px 8px', verticalAlign: 'top' },
  tdSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  editBtn: { padding: '4px 10px', marginRight: 4, fontSize: 12, background: 'white', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', color: '#374151' },
  deleteBtn: { padding: '4px 10px', fontSize: 12, background: 'white', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', color: '#dc2626' },
  toggleBtn: { padding: '4px 10px', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: '#374151' },
  loginContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5', fontFamily: '-apple-system, "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' },
  loginBox: { width: '100%', maxWidth: 400, padding: 32, background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  loginTitle: { fontSize: 22, fontWeight: 700, margin: 0, textAlign: 'center' },
  loginSubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', margin: '4px 0 24px 0' },
  input: { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' },
  loginBtn: { width: '100%', padding: '10px 20px', background: '#6B1D2E', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 8 },
  error: { padding: 10, background: '#fef2f2', color: '#dc2626', fontSize: 13, borderRadius: 6, marginBottom: 12 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', zIndex: 100, overflowY: 'auto' },
  modal: { width: '100%', maxWidth: 720, background: 'white', borderRadius: 8, padding: 32, boxShadow: '0 20px 25px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 20, fontWeight: 700, margin: '0 0 24px 0' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' },
  sectionTitle: { fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', margin: '24px 0 12px 0', paddingBottom: 6, borderBottom: '1px solid #f3f4f6' },
  formRow: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' },
};

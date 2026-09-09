import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertTriangle, ArrowDownToLine, BookOpenCheck, ChevronDown, ChevronUp, CircleCheck, ClipboardCheck, FileText, FolderOpen, History, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSource from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import ruleData from '../../rules/2026.json';
import type { RuleSet } from '../../shared/types.ts';
import { analyzeOffline, type OfflineAssessment, type OfflinePage } from './offline-analysis.ts';
import './offline-mobile.css';

GlobalWorkerOptions.workerSrc = workerSource;

type SavedProject = { id: string; name: string; ruleId: string; fileName: string; pages: OfflinePage[]; reviewerNotes: string; updatedAt: string };

const databaseName = 'erasmus-offline-projects';
const storeName = 'projects';
const supportedRules = (ruleData as RuleSet[]).filter(rule => rule.status === 'verified' && rule.mode === 'quality');
const sectorNames: Record<string, string> = { SCH: 'Okul Eğitimi', VET: 'Mesleki Eğitim', ADU: 'Yetişkin Eğitimi', YOU: 'Gençlik', HED: 'Yükseköğretim' };
const actionNames: Record<string, string> = { KA122: 'Kısa dönem öğrenici ve personel hareketliliği', KA152: 'Gençlik değişimleri', KA153: 'Gençlik çalışanı hareketliliği', KA154: 'Gençlik katılım faaliyetleri', KA210: 'Küçük ölçekli ortaklıklar', KA220: 'İş birliği ortaklıkları', KA240: 'Okul gelişim ortaklıkları' };

function openProjectsDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadProjects() {
  const database = await openProjectsDb();
  return new Promise<SavedProject[]>((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as SavedProject[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  });
}

async function saveProject(project: SavedProject) {
  const database = await openProjectsDb();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(storeName, 'readwrite').objectStore(storeName).put(project);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function deleteProject(id: string) {
  const database = await openProjectsDb();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function safeId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

function base64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function readPdf(file: File): Promise<OfflinePage[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const document = await getDocument({ data: bytes }).promise;
  const pages: OfflinePage[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map(item => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ page: pageNumber, text });
  }
  return pages;
}

function shortDate(value: string) { return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }

function reportText(rule: RuleSet, fileName: string, result: OfflineAssessment) {
  return [
    'ERASMUS+ PROJE ATÖLYESİ — YEREL ÖN DEĞERLENDİRME RAPORU', '', `Dosya: ${fileName}`, `Paket: ${rule.actionCode}-${rule.sector} · ${rule.callYear}`, `Kaynak: ${rule.sourceUrl}`, `Yerel kanıt puanı: ${result.total}/100`, `Resmî toplam eşik: ${result.totalThreshold ?? 'Bu paket için tanımlı değil'}`, `Durum: ${result.totalPassed ? 'Eşik kanıt düzeyinde karşılandı' : 'Eşik riski var'}`, '', 'ÖLÇÜT BAZINDA',
    ...result.criteria.map(item => `${item.criterion.name}: ${item.score}/${item.criterion.max} · alt eşik ${item.criterion.threshold} · ${item.passed ? 'karşılandı' : 'risk'}`), '', 'DÜZELTME LİSTESİ',
    ...result.findings.map(item => `- ${item.title}\n  Neden: ${item.reason}\n  Düzenleme: ${item.correction}\n  Öneri: ${item.draft}`), '', 'Not: Bu rapor çevrimdışı, kanıt tabanlı bir ön kontroldür. Resmî değerlendirici kararı veya fonlama taahhüdü değildir.'
  ].join('\n');
}

export function OfflineMobileApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ruleId, setRuleId] = useState(supportedRules[0]?.id ?? '');
  const [pages, setPages] = useState<OfflinePage[]>([]);
  const [fileName, setFileName] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [assessment, setAssessment] = useState<OfflineAssessment | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [saved, setSaved] = useState<SavedProject[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const activeRule = useMemo(() => supportedRules.find(rule => rule.id === ruleId) ?? supportedRules[0], [ruleId]);

  useEffect(() => { loadProjects().then(setSaved).catch(() => setMessage('Telefon depolamasına erişilemedi. Bu oturumdaki analiz yine de çalışır.')); }, []);

  function resetForRule(nextRuleId: string) {
    setRuleId(nextRuleId); setAssessment(null); setSelectedPage(null); setMessage('Eylem değişti. Dosyayı seçtikten sonra yeniden analiz edin.');
  }

  async function acceptFile(file: File | undefined) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { setMessage('Mobil yerel analiz şu anda yalnızca PDF kabul eder. DOCX/XLSX için web çalışma alanını kullanabilirsiniz.'); return; }
    if (file.size > 35 * 1024 * 1024) { setMessage('PDF 35 MB sınırını aşıyor. Telefonda güvenilir analiz için daha küçük veya bölünmüş PDF kullanın.'); return; }
    setBusy(true); setMessage('PDF telefonda okunuyor… İnternete gönderilmiyor.');
    try {
      const extracted = await readPdf(file);
      setFileName(file.name); setPages(extracted); setAssessment(null); setProjectId(null); setSelectedPage(extracted[0]?.page ?? null);
      const readable = extracted.filter(page => page.text.length > 20).length;
      setMessage(`${extracted.length} sayfa okundu; ${readable} sayfada aranabilir metin bulundu. Analizi başlatın.`);
    } catch (error) { setMessage(`PDF okunamadı: ${(error as Error).message}. Şifreli veya bozuk dosya olmadığını kontrol edin.`); } finally { setBusy(false); }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) { void acceptFile(event.target.files?.[0]); }
  function onDrop(event: DragEvent<HTMLButtonElement>) { event.preventDefault(); void acceptFile(event.dataTransfer.files?.[0]); }

  async function runAnalysis() {
    if (!activeRule || !pages.length) { setMessage('Önce eylemi seçin ve PDF dosyanızı yükleyin.'); return; }
    setBusy(true); setMessage('Resmî ölçütlere göre yerel kanıt taraması yapılıyor…');
    await new Promise(resolve => setTimeout(resolve, 120));
    const result = analyzeOffline(activeRule, pages, reviewerNotes);
    setAssessment(result);
    const id = projectId ?? safeId(); setProjectId(id);
    const record: SavedProject = { id, name: fileName.replace(/\.pdf$/i, '') || 'Adsız başvuru', ruleId: activeRule.id, fileName, pages, reviewerNotes, updatedAt: new Date().toISOString() };
    try { await saveProject(record); setSaved(await loadProjects()); } catch { setMessage('Analiz tamamlandı, ancak telefona kalıcı kaydedilemedi.'); }
    setMessage(result.totalPassed ? 'Analiz tamamlandı. Tüm ölçütlerde yerel eşik kanıtı bulundu.' : 'Analiz tamamlandı. Yüksek öncelikli düzeltmeleri inceleyin.'); setBusy(false);
  }

  function jumpTo(page?: number) {
    if (!page) return;
    setSelectedPage(page);
    window.setTimeout(() => document.getElementById(`mobile-page-${page}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  async function downloadReport() {
    if (!assessment || !activeRule) return;
    const content = reportText(activeRule, fileName, assessment);
    const name = `${fileName.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '_') || 'erasmus-on-degerlendirme'}-rapor.txt`;
    if (Capacitor.isNativePlatform()) {
      try {
        const file = await Filesystem.writeFile({ path: `Erasmus Raporları/${name}`, data: base64(content), directory: Directory.Documents, recursive: true });
        try { await Share.share({ title: 'Erasmus+ ön değerlendirme raporu', text: 'Yerel analiz raporu hazır.', url: file.uri, dialogTitle: 'Raporu paylaş veya kaydet' }); } catch { /* File was written even when no share target is installed. */ }
        setMessage('Rapor telefonunuza kaydedildi. Paylaşım menüsünden hedefi seçebilirsiniz.');
        return;
      } catch (error) { setMessage(`Rapor telefon depolamasına yazılamadı: ${(error as Error).message}`); return; }
    }
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restore(project: SavedProject) {
    setProjectId(project.id); setRuleId(project.ruleId); setFileName(project.fileName); setPages(project.pages); setReviewerNotes(project.reviewerNotes); setAssessment(null); setSelectedPage(project.pages[0]?.page ?? null); setHistoryOpen(false);
    setMessage('Kaydedilmiş başvuru açıldı. Güncel kurallarla yeniden analiz etmek için Analiz Et düğmesine dokunun.');
  }
  async function remove(project: SavedProject) { await deleteProject(project.id); setSaved(await loadProjects()); if (project.id === projectId) setProjectId(null); }

  if (!activeRule) return <main className="m-app"><p>Doğrulanmış mobil kural paketi bulunamadı.</p></main>;
  return <main className="m-app">
    <header className="m-header"><div className="m-brand"><span><Sparkles size={20} /></span><div><strong>Erasmus+</strong><small>YEREL PROJE ANALİZİ</small></div></div><button className="m-history-button" onClick={() => setHistoryOpen(value => !value)} aria-expanded={historyOpen}><History size={18} /> Kayıtlar</button></header>
    {historyOpen && <section className="m-history" aria-label="Telefona kaydedilen başvurular"><div><strong>Telefona kaydedilen başvurular</strong><span>{saved.length} kayıt</span></div>{!saved.length && <p>Henüz telefonunuza kaydedilmiş bir analiz yok.</p>}{saved.map(project => <article key={project.id}><button onClick={() => void restore(project)}><FolderOpen size={17} /><span><strong>{project.name}</strong><small>{project.fileName} · {shortDate(project.updatedAt)}</small></span></button><button className="m-icon-button" onClick={() => void remove(project)} aria-label={`${project.name} kaydını sil`}><X size={17} /></button></article>)}</section>}
    <section className="m-hero"><span className="m-eyebrow"><ShieldCheck size={14} /> TELEFONUNUZDA ÇALIŞIR</span><h1>Başvurunuzu<br /><em>sıkı biçimde</em> kontrol edin.</h1><p>PDF ve değerlendirme verisi telefonunuzdan dışarı çıkmaz. Tailscale, hesap veya sürekli açık bilgisayar gerekmez.</p><div className="m-hero-pills"><span><CircleCheck size={14} /> 2026 doğrulanmış ölçütler</span><span><CircleCheck size={14} /> Çevrimdışı</span></div></section>
    <section className="m-card m-rule-card"><div className="m-card-head"><div><span className="m-step">1</span><h2>Çağrı türünü seçin</h2></div><BookOpenCheck size={20} /></div><label className="m-select-label">Doğrulanmış 2026 çağrı paketi<select value={ruleId} onChange={event => resetForRule(event.target.value)}>{supportedRules.map(rule => <option value={rule.id} key={rule.id}>{rule.actionCode}-{rule.sector} · {sectorNames[rule.sector]} · {actionNames[rule.actionCode]}</option>)}</select></label><div className="m-rule-summary"><strong>{activeRule.actionCode}-{activeRule.sector}</strong><span>{sectorNames[activeRule.sector]} · Toplam eşik {activeRule.totalThreshold}/100</span></div><details><summary>Resmî ölçütler <ChevronDown size={17} /></summary><div className="m-criteria-list">{activeRule.criteria.map(criterion => <div key={criterion.id}><strong>{criterion.name}</strong><span>{criterion.max} puan · alt eşik {criterion.threshold}</span><small>{criterion.elements.length} resmî kontrol maddesi · {criterion.sourceSection}</small></div>)}</div></details><a href={activeRule.sourceUrl} target="_blank" rel="noreferrer">Resmî kaynak ve ölçütler ↗</a></section>
    <section className="m-card"><div className="m-card-head"><div><span className="m-step">2</span><h2>Başvuru PDF’nizi ekleyin</h2></div><FileText size={20} /></div><input ref={inputRef} className="m-file-input" type="file" accept="application/pdf,.pdf" onChange={onFileChange} /><button className="m-dropzone" onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={onDrop} disabled={busy}>{busy ? <LoaderCircle className="m-spin" size={28} /> : <Upload size={28} />}<strong>{fileName || 'PDF dosyasını seçin veya sürükleyin'}</strong><span>{fileName ? `${pages.length} sayfa hazır` : 'PDF · en fazla 35 MB · metin katmanı gerekli'}</span></button><p className="m-note"><AlertTriangle size={15} /> Taranmış görüntü PDF’lerde önce OCR gerekir. Bu APK metni yerelde tarar; dosyanızı yüklemez.</p></section>
    <section className="m-card"><div className="m-card-head"><div><span className="m-step">3</span><h2>Geçmiş hakem notu <small>isteğe bağlı</small></h2></div><ClipboardCheck size={20} /></div><textarea value={reviewerNotes} onChange={event => { setReviewerNotes(event.target.value); setAssessment(null); }} placeholder="Örn. Hakem: Risk yönetimi ayrıntısız, yaygınlaştırma hedef kitlesi belirsiz." rows={4} /><p className="m-note">Notları puana eklemiyoruz; metinde karşılanmayan tema varsa öncelikli düzeltme oluşturuyoruz.</p></section>
    <button className="m-analyze" onClick={() => void runAnalysis()} disabled={busy || !pages.length}>{busy ? <><LoaderCircle className="m-spin" size={19} /> Analiz ediliyor…</> : <><Sparkles size={19} /> Yerelde analiz et</>}</button>{message && <div className="m-status" role="status">{message}</div>}
    {assessment && <><section className={`m-score ${assessment.totalPassed ? 'passed' : 'needs-work'}`}><div><span>YEREL KANIT PUANI</span><strong>{assessment.total}<small>/100</small></strong><p>{assessment.totalPassed ? 'Tüm ölçütlerde alt eşik kanıtı bulundu.' : 'Bir veya daha fazla ölçütte alt eşik riski var.'}</p></div><div className="m-score-ring"><span>{assessment.totalThreshold}</span><small>resmî eşik</small></div></section><p className="m-score-note">Bu puan, telefonunuzdaki metinde bulunan kanıtların katı ön kontrolüdür. Resmî hakem kararı değildir; genel ifadeler ve tek sayfalık kanıtlar puanı bilinçli olarak sınırlar.</p>
      <section className="m-card m-results-card"><div className="m-card-head"><div><span className="m-step">4</span><h2>Ölçüt ve eşik sonucu</h2></div><span className="m-pages">{assessment.scannedPages} sayfa</span></div>{assessment.criteria.map(item => <article className="m-criterion-result" key={item.criterion.id}><div><strong>{item.criterion.name}</strong><span>{item.score}/{item.criterion.max} · alt eşik {item.criterion.threshold}</span></div><b className={item.passed ? 'good' : 'bad'}>{item.passed ? 'Karşılandı' : 'Risk'}</b><small>{item.evidence.length} kanıt göstergesi · kanıt gücü %{Math.round(item.evidenceFactor * 100)}</small>{!!item.evidence.length && <div className="m-evidence-chips">{item.evidence.map(evidence => <button key={evidence.signal} onClick={() => jumpTo(evidence.page)}>{evidence.label} · s.{evidence.page}</button>)}</div>}</article>)}</section>
      <section className="m-card m-findings"><div className="m-card-head"><div><span className="m-step">5</span><h2>Düzeltme listesi</h2></div><span className="m-pages">{assessment.findings.length} bulgu</span></div>{!assessment.findings.length && <div className="m-clear"><CircleCheck size={22} /><strong>Yerel taramada eksik kanıt bulunmadı.</strong><span>Yine de metni resmî form ve ulusal ajans duyurusuyla birlikte son kez gözden geçirin.</span></div>}{assessment.findings.map(finding => <article key={finding.id} className={`m-finding ${finding.severity}`}><button className="m-finding-main" onClick={() => setExpandedFinding(value => value === finding.id ? null : finding.id)}><span className={`m-severity ${finding.severity}`}>{finding.severity === 'high' ? 'Öncelikli' : 'Geliştir'}</span><strong>{finding.title}</strong><small>{finding.reason}</small>{expandedFinding === finding.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>{expandedFinding === finding.id && <div className="m-finding-detail"><p><b>Ne yapmalı?</b> {finding.correction}</p><p><b>Alternatif içerik:</b> {finding.draft}</p>{finding.page && <button className="m-jump" onClick={() => jumpTo(finding.page)}>Metinde kanıta git · sayfa {finding.page}</button>}</div>}</article>)}</section>
      <button className="m-download" onClick={() => void downloadReport()}><ArrowDownToLine size={18} /> Raporu indir</button>
      <section className="m-card m-document"><div className="m-card-head"><div><span className="m-step">6</span><h2>Çıkarılan metin</h2></div><button className="m-refresh" onClick={() => void runAnalysis()}><RefreshCw size={16} /> Yenile</button></div><p className="m-note">Bulgu veya kanıt etiketine dokununca ilgili sayfaya gelirsiniz.</p>{pages.map(page => <article id={`mobile-page-${page.page}`} className={`m-page ${selectedPage === page.page ? 'selected' : ''}`} key={page.page}><header><strong>Sayfa {page.page}</strong><button onClick={() => setSelectedPage(page.page)}>Odakla</button></header><p>{page.text || 'Bu sayfada aranabilir metin bulunamadı.'}</p></article>)}</section>
    </>}
  </main>;
}

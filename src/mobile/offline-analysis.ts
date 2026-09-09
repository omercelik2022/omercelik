import type { Criterion, RuleSet } from '../../shared/types.ts';

export type OfflinePage = { page: number; text: string };
export type SignalId =
  | 'need' | 'target' | 'profile' | 'euValues' | 'inclusion' | 'objective'
  | 'metric' | 'activity' | 'method' | 'timeline' | 'participant' | 'preparation'
  | 'risk' | 'monitoring' | 'dissemination' | 'sustainability' | 'integration'
  | 'partner' | 'roles' | 'communication' | 'resources' | 'management'
  | 'continuity' | 'quality';

type Signal = { id: SignalId; label: string; expression: RegExp; correction: string; draft: string };

export type OfflineEvidence = { signal: SignalId; label: string; page: number; quote: string };
export type OfflineCriterion = {
  criterion: Criterion;
  score: number;
  passed: boolean;
  evidence: OfflineEvidence[];
  missing: Signal[];
  evidenceFactor: number;
};
export type OfflineFinding = {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  correction: string;
  draft: string;
  page?: number;
  criterionId?: string;
};
export type OfflineAssessment = {
  criteria: OfflineCriterion[];
  findings: OfflineFinding[];
  total: number;
  totalThreshold: number | null;
  totalPassed: boolean;
  scannedPages: number;
  reviewerAlerts: number;
};

const signals: Record<SignalId, Signal> = {
  need: { id: 'need', label: 'İhtiyaç analizi', expression: /ihtiya[cç]|needs?\s+analys|anket|survey|mevcut durum|sorun analizi/i, correction: 'İhtiyacı iddia etmekle yetinmeyin; veri, gözlem veya paydaş görüşüyle gerekçelendirin.', draft: 'İhtiyaç analizi, [veri kaynağı] ile yürütülmüş; bulgular [hedef grubun] şu somut ihtiyacını göstermiştir: [bulgu].' },
  target: { id: 'target', label: 'Hedef grup', expression: /hedef grup|target group|ö[ğg]renci|learner|kat[ıi]l[ıi]mc[ıi]|participant/i, correction: 'Hedef grubun büyüklüğünü, profilini ve seçilme gerekçesini yazın.', draft: 'Hedef grup [sayı] kişiden oluşur; seçim ölçütleri [ölçütler] olup bu grubun ihtiyacı [ihtiyaç]tır.' },
  profile: { id: 'profile', label: 'Kurum profili ve deneyim', expression: /kurum.*(deneyim|faaliyet|profil)|institution.*(experience|profile)|önceki proje|previous project/i, correction: 'Kurumun gerçek faaliyetini ve önceki deneyiminin teklif ile bağını açıkça kurun.', draft: 'Kurumumuzun [alan] alanındaki [deneyim/faaliyet]i, önerilen [faaliyet] için doğrudan kapasite oluşturmaktadır.' },
  euValues: { id: 'euValues', label: 'AB önceliği veya ortak değer', expression: /avrupa|european|ab öncel|equality|eşitlik|demokrasi|democracy|sürdürülebilir|digital|dijital/i, correction: 'İlgili AB önceliğini faaliyete ve beklenen çıktıya bağlayın.', draft: '[AB önceliği] projenin [faaliyeti] içinde [somut uygulama] ile ele alınacak ve [çıktı] ile ölçülecektir.' },
  inclusion: { id: 'inclusion', label: 'Kapsayıcılık ve fırsat eşitliği', expression: /daha az fırsat|fewer opportunities|kapsay[ıi]c[ıi]|inclusion|engell|dezavantaj|disadvantag/i, correction: 'Engelleri, erişim düzenlemelerini ve destek tedbirlerini tek tek belirtin.', draft: 'Daha az fırsata sahip katılımcılar için [engel]i azaltmak üzere [erişilebilirlik/destek] tedbirleri uygulanacaktır.' },
  objective: { id: 'objective', label: 'Somut hedef', expression: /hedef|objective|ama[cç]|goal|çıktı|output/i, correction: 'Hedefi ölçülebilir bir sonuç, sorumlu ve tarih ile yazın.', draft: '[Tarih] tarihine kadar [hedef grup] için [ölçülebilir sonuç] elde edilecek; sorumlu [rol] olacaktır.' },
  metric: { id: 'metric', label: 'Gösterge ve ölçüm', expression: /gösterge|indicator|öl[cç]üm|measure|%|yüzde|baseline|hedef değer|target value/i, correction: 'Başlangıç değeri, hedef değer, veri kaynağı ve ölçüm sıklığını ekleyin.', draft: '[Gösterge] için başlangıç değeri [x], hedef değer [y]; veri [kaynak]tan [sıklık]la toplanacaktır.' },
  activity: { id: 'activity', label: 'Faaliyet kurgusu', expression: /faaliyet|activity|atölye|workshop|hareketlilik|mobility|çalışma paketi|work package/i, correction: 'Her faaliyeti ihtiyaç, hedef ve çıktı ile eşleyin.', draft: '[Faaliyet] [hedef]e hizmet eder; [sorumlu] tarafından [tarih aralığı]nda yürütülür ve [çıktı] üretir.' },
  method: { id: 'method', label: 'Yöntem ve pedagojik yaklaşım', expression: /yöntem|methodolog|öğrenme yöntemi|learning approach|katılımcı.*yöntem|non.formal/i, correction: 'Yöntemi adıyla belirtin ve katılımcının bu yöntem içindeki rolünü açıklayın.', draft: '[Yöntem] kullanılacak; katılımcılar [uygulama] yoluyla aktif rol alacak ve [çıktı] üretecektir.' },
  timeline: { id: 'timeline', label: 'Takvim ve sıralama', expression: /takvim|timeline|zaman çizelgesi|ay[ıi]|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april/i, correction: 'Hazırlık, uygulama, izleme ve yaygınlaştırmayı tarihleriyle sıralayın.', draft: 'Takvim: [tarih] hazırlık, [tarih] uygulama, [tarih] değerlendirme ve [tarih] yaygınlaştırma.' },
  participant: { id: 'participant', label: 'Katılımcı seçimi ve profil uyumu', expression: /seçim ölçüt|selection criteria|katılımcı seç|participant selection|profil/i, correction: 'Katılımcı sayısı, seçim ölçütü, şeffaf seçim yöntemi ve destek tedbirini belirtin.', draft: 'Katılımcılar [şeffaf seçim yöntemi] ile [ölçütler]e göre seçilecek; [sayı] kişi için [destek] sağlanacaktır.' },
  preparation: { id: 'preparation', label: 'Hazırlık ve güvenlik', expression: /hazırlık|preparation|güvenlik|safety|koruma|safeguard|sigorta|insurance/i, correction: 'Dil/kültür hazırlığı, risk azaltma ve kriz iletişim adımlarını birlikte açıklayın.', draft: 'Uygulama öncesi [dil/kültür] hazırlığı yapılacak; [risk] için [tedbir] ve [acil iletişim] uygulanacaktır.' },
  risk: { id: 'risk', label: 'Risk yönetimi', expression: /risk|olasılık|mitigat|önlem|acil durum|contingen/i, correction: 'Her önemli risk için olasılık, etki, sorumlu ve önleyici tedbir yazın.', draft: 'Risk: [risk]; olasılık: [düşük/orta/yüksek]; tedbir: [eylem]; sorumlu: [rol]; gözden geçirme: [tarih].' },
  monitoring: { id: 'monitoring', label: 'İzleme ve kalite güvencesi', expression: /izleme|monitoring|kalite güvence|quality assurance|değerlendirme|evaluation|geri bildirim|feedback/i, correction: 'İzlemenin ne zaman, kim tarafından ve hangi kanıtla yapılacağını tanımlayın.', draft: '[Sorumlu], [sıklık]la [gösterge]yi kontrol edecek; sonuçlar [toplantı/rapor] ile düzeltici eyleme dönüştürülecektir.' },
  dissemination: { id: 'dissemination', label: 'Yaygınlaştırma', expression: /yaygınlaştır|disseminat|paylaşım|communication plan|görünürlük|visibility/i, correction: 'Hedef kitle, kanal, içerik, tarih ve erişim göstergesini ekleyin.', draft: '[Çıktı], [hedef kitle]ye [kanal] üzerinden [tarih]te ulaştırılacak; erişim [gösterge] ile takip edilecektir.' },
  sustainability: { id: 'sustainability', label: 'Sürdürülebilirlik', expression: /sürdürülebilir|sustainab|devamlılık|long.term|kalıcı/i, correction: 'Hibe sonrası sahiplik, kaynak ve devam eden faaliyeti açıkça yazın.', draft: 'Hibe sonrasında [rol/birim], [kaynak] ile [faaliyet]i sürdürecek; [tarih]te kalıcılık gözden geçirilecektir.' },
  integration: { id: 'integration', label: 'Sonuçların kuruma aktarılması', expression: /kuruma.*aktar|integrat|müfredat|curriculum|kurumsal.*plan|regular work/i, correction: 'Öğrenme çıktılarının hangi kurum sürecine nasıl aktarılacağını belirtin.', draft: '[Öğrenme çıktısı], [kurum süreci/müfredat]a [yöntem] ile aktarılacak; uygulama [sorumlu] tarafından izlenecektir.' },
  partner: { id: 'partner', label: 'Ortak seçimi ve tamamlayıcılık', expression: /ortak|partner|konsorsiyum|consortium|tamamlayıc/i, correction: 'Her ortağın seçilme nedenini ve getirdiği özgün kapasiteyi açıklayın.', draft: '[Ortak] [uzmanlık] nedeniyle seçilmiştir; bu kapasite [faaliyet/çıktı] için [katkı] sağlayacaktır.' },
  roles: { id: 'roles', label: 'Görev dağılımı', expression: /görev dağılım|role[s]?|sorumlu|responsib|iş bölümü|division of tasks/i, correction: 'Görevleri ortak, iş paketi, teslimat ve sorumlu kişi düzeyinde netleştirin.', draft: '[Ortak/rol], [iş paketi]nin [teslimat]ından sorumludur; onay mercii [rol]dür.' },
  communication: { id: 'communication', label: 'İletişim ve koordinasyon', expression: /iletişim|communication|koordinasyon|coordination|toplantı|meeting/i, correction: 'Toplantı sıklığı, karar alma, kayıt ve sorun yükseltme yolunu yazın.', draft: '[Sıklık] koordinasyon toplantısı yapılacak; kararlar [kayıt]ta tutulacak, uyuşmazlıklar [yol] ile çözülecektir.' },
  resources: { id: 'resources', label: 'Kaynak ve kapasite', expression: /kaynak|resource|bütçe|budget|personel|staff|kapasite|capacity/i, correction: 'İnsan kaynağını, zamanı ve bütçeyi faaliyete bağlayın.', draft: '[Faaliyet] için [rol/saat] insan kaynağı ve [bütçe/kaynak] ayrılmıştır; yeterlilik [kanıt] ile doğrulanacaktır.' },
  management: { id: 'management', label: 'Yönetim yapısı', expression: /(?:proje|project|kurumsal|organizasyon|programme)\s+yönetim|management|koordinatör|coordinator|yönetişim|governance/i, correction: 'Karar alma, kontrol ve sorumluluk zincirini şematik ve metinsel olarak tanımlayın.', draft: '[Yönetim kurulu/koordinatör], [karar]dan sorumludur; [kontrol] [sıklık]la yapılır ve [kayıt]ta tutulur.' },
  continuity: { id: 'continuity', label: 'Personel değişiminde süreklilik', expression: /personel değiş|staff change|süreklilik|continuity|devir teslim|handover/i, correction: 'Personel değişiminde belge, yetki ve bilgi devrinin nasıl yapılacağını yazın.', draft: 'Personel değişiminde [doküman] güncel tutulacak; [rol] için [yedek/devir teslim] prosedürü uygulanacaktır.' },
  quality: { id: 'quality', label: 'Uygulama kalitesi', expression: /kalite|quality|standard|standart|kontrol listesi|checklist/i, correction: 'Kalite standardını, doğrulama anını ve düzeltici eylemi belirtin.', draft: '[Kalite standardı] [kontrol noktası]nda doğrulanacak; uygunsuzlukta [düzeltici eylem] [sorumlu] tarafından başlatılacaktır.' }
};

const profiles: Record<string, SignalId[]> = {
  relevance: ['need', 'target', 'profile', 'euValues', 'inclusion', 'objective'],
  design: ['objective', 'activity', 'method', 'timeline', 'participant', 'preparation', 'risk', 'monitoring'],
  impact: ['metric', 'monitoring', 'dissemination', 'sustainability', 'integration'],
  partnership: ['partner', 'roles', 'communication', 'management', 'quality'],
  management: ['management', 'roles', 'resources', 'risk', 'continuity', 'monitoring', 'quality']
};

function norm(value: string) { return value.toLocaleLowerCase('tr-TR'); }

function profileFor(criterion: Criterion): SignalId[] {
  const title = norm(criterion.name);
  if (title.includes('ortaklık') || title.includes('iş birliği') || title.includes('partnership')) return profiles.partnership;
  if (title.includes('yönetim') || title.includes('management')) return profiles.management;
  if (title.includes('takip') || title.includes('etki') || title.includes('impact')) return profiles.impact;
  if (title.includes('ilgili') || title.includes('relevance') || title.includes('gerekçe')) return profiles.relevance;
  return profiles.design;
}

function pageMatch(expression: RegExp, pages: OfflinePage[]) {
  return pages.find(page => expression.test(page.text));
}

function quote(text: string, expression: RegExp) {
  const match = expression.exec(text);
  if (!match || match.index === undefined) return text.slice(0, 180).trim();
  const start = Math.max(0, match.index - 70);
  return text.slice(start, Math.min(text.length, match.index + match[0].length + 110)).replace(/\s+/g, ' ').trim();
}

function hasQuantifiedEvidence(pages: OfflinePage[]) {
  return pages.some(page => /\b\d{1,4}\b|%|yüzde|percent|baseline|hedef değer|target value/i.test(page.text));
}

function findingId(prefix: string, index: number) { return `${prefix}-${index + 1}`; }

export function analyzeOffline(rule: RuleSet, pages: OfflinePage[], reviewerNotes = ''): OfflineAssessment {
  const usablePages = pages.filter(page => page.text.trim().length > 20);
  const findings: OfflineFinding[] = [];
  if (!usablePages.length) {
    return {
      criteria: rule.criteria.map(criterion => ({ criterion, score: 0, passed: false, evidence: [], missing: profileFor(criterion).map(id => signals[id]), evidenceFactor: 0 })),
      findings: [{ id: 'readability-1', title: 'PDF metni okunamadı', severity: 'high', reason: 'Yerel tarama, seçilen PDF içinde yeterli metin bulamadı.', correction: 'Metin katmanı olan PDF yükleyin veya dosyayı OCR ile metin aranabilir hale getirin.', draft: 'Taranmış PDF için OCR uygulanmalı; ardından proje metni yeniden analiz edilmelidir.' }],
      total: 0,
      totalThreshold: rule.totalThreshold,
      totalPassed: false,
      scannedPages: pages.length,
      reviewerAlerts: 0
    };
  }

  const criteria = rule.criteria.map(criterion => {
    const profile = profileFor(criterion);
    const evidence: OfflineEvidence[] = [];
    const missing: Signal[] = [];
    for (const id of profile) {
      const signal = signals[id];
      const page = pageMatch(signal.expression, usablePages);
      if (page) evidence.push({ signal: id, label: signal.label, page: page.page, quote: quote(page.text, signal.expression) });
      else missing.push(signal);
    }
    const distinctPages = new Set(evidence.map(item => item.page)).size;
    const coverage = evidence.length / profile.length;
    const evidenceFactor = evidence.length === 0 ? 0 : distinctPages >= 3 && hasQuantifiedEvidence(usablePages) ? 1 : distinctPages >= 2 ? 0.82 : 0.64;
    const score = Math.min(criterion.max, Math.floor(criterion.max * coverage * evidenceFactor));
    for (const signal of missing) {
      findings.push({
        id: findingId(`${criterion.id}-${signal.id}`, findings.length),
        title: `${criterion.name}: ${signal.label} eksik`,
        severity: score < criterion.threshold ? 'high' : 'medium',
        reason: `${criterion.sourceSection} altında bu kanıt bulunamadı. Yerel motor, yalnızca başvuru metnindeki göstergeyi dikkate alır.`,
        correction: signal.correction,
        draft: signal.draft,
        criterionId: criterion.id
      });
    }
    if (score < criterion.threshold && evidence.length) {
      findings.push({
        id: findingId(`${criterion.id}-threshold`, findings.length),
        title: `${criterion.name}: alt eşik riski`,
        severity: 'high',
        reason: `${score}/${criterion.max} puanlık kanıt bulundu; resmî alt eşik ${criterion.threshold}/${criterion.max}. Tek paragrafta geçen genel ifadeler güçlü kanıt sayılmaz.`,
        correction: 'Eksik göstergeyi somut faaliyet, sorumlu, tarih ve ölçümle tamamlayın.',
        draft: 'Her iddia için sorumlu, tarih, ölçülebilir gösterge ve doğrulama kaynağını aynı bölümde belirtin.',
        page: evidence[0]?.page,
        criterionId: criterion.id
      });
    }
    return { criterion, score, passed: score >= criterion.threshold, evidence, missing, evidenceFactor };
  });

  const reviewerSignals = (Object.values(signals) as Signal[]).filter(signal => signal.expression.test(reviewerNotes));
  for (const signal of reviewerSignals) {
    const alreadyCovered = criteria.some(criterion => criterion.evidence.some(item => item.signal === signal.id));
    if (!alreadyCovered) {
      findings.unshift({
        id: `reviewer-${signal.id}`,
        title: `Geçmiş hakem notu: ${signal.label} karşılanmamış`,
        severity: 'high',
        reason: 'Eklediğiniz geçmiş hakem notunda bu tema geçiyor; yüklenen metinde yerel kanıt eşleşmesi bulunamadı.',
        correction: signal.correction,
        draft: signal.draft
      });
    }
  }
  const total = criteria.reduce((sum, item) => sum + item.score, 0);
  const threshold = rule.totalThreshold;
  return {
    criteria,
    findings,
    total,
    totalThreshold: threshold,
    totalPassed: threshold !== null && total >= threshold && criteria.every(item => item.passed),
    scannedPages: usablePages.length,
    reviewerAlerts: reviewerSignals.length
  };
}

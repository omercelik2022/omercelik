import test from 'node:test';
import assert from 'node:assert/strict';
import type { RuleSet } from '../shared/types.ts';
import { analyzeOffline } from '../src/mobile/offline-analysis.ts';

const rule: RuleSet = {
  id: 'local-ka122', callYear: 2026, actionCode: 'KA122', sector: 'SCH', jurisdiction: 'TR', agency: 'TR01', round: 'R1', applicantRole: 'applicant', guideVersion: 'test', formVersion: 'test', effectiveDate: '2026-01-01', checkedAt: '2026-01-01', sourceUrl: 'https://example.test', sourceSection: 'Award criteria', sourcePage: null, contentHash: 'test', status: 'verified', supersedes: null, mode: 'quality', totalThreshold: 60, sources: [], formFields: [], formVerified: true, limitations: [], eligibility: [], budget: { model: 'none', lumpSums: [], individualRate: null, allocationVerified: false }, criteria: [
    { id: 'relevance', name: 'İlgililik', max: 20, threshold: 10, description: '', sourceId: 'guide', sourceSection: 'Relevance', elements: [] },
    { id: 'design', name: 'Proje tasarımının kalitesi', max: 50, threshold: 25, description: '', sourceId: 'guide', sourceSection: 'Design', elements: [] },
    { id: 'impact', name: 'Takip faaliyetlerinin kalitesi', max: 30, threshold: 15, description: '', sourceId: 'guide', sourceSection: 'Follow-up', elements: [] }
  ]
};

test('empty or scanned documents never receive a quality score', () => {
  const result = analyzeOffline(rule, [{ page: 1, text: '' }]);
  assert.equal(result.total, 0);
  assert.equal(result.totalPassed, false);
  assert.equal(result.findings[0].title, 'PDF metni okunamadı');
});

test('strict scoring requires evidence across each official criterion', () => {
  const result = analyzeOffline(rule, [
    { page: 1, text: 'İhtiyaç analizi anketi hedef grup öğrencilerle yapıldı. Kurumun önceki proje deneyimi vardır. Avrupa önceliği eşitlik ve kapsayıcılık için hedef oluşturuldu.' },
    { page: 2, text: 'Hedefe ulaşmak için faaliyet ve atölye yöntemi uygulanacak. Takvim Ocak ayında başlar. Katılımcı seçim ölçütleri açıktır. Hazırlık ve güvenlik planı vardır. Risk önlemi ile izleme yapılacaktır.' },
    { page: 3, text: 'Gösterge için başlangıç değeri 10 ve hedef değer %80 olarak belirlendi. Değerlendirme ve geri bildirim yapılacak. Yaygınlaştırma planı ile sonuçlar paylaşılacak, sürdürülebilirlik için kuruma aktarılacaktır.' }
  ]);
  assert.ok(result.total >= 60);
  assert.equal(result.totalPassed, true);
  assert.ok(result.criteria.every(item => item.passed));
});

test('a pasted reviewer concern becomes a high-priority repair item when its evidence is absent', () => {
  const result = analyzeOffline(rule, [{ page: 1, text: 'İhtiyaç analizi ve hedef grup açıklanmıştır.' }], 'Hakem notu: Risk yönetimi ayrıntısız.');
  assert.equal(result.findings[0].title, 'Geçmiş hakem notu: Risk yönetimi karşılanmamış');
  assert.equal(result.findings[0].severity, 'high');
});

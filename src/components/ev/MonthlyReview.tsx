import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import type { useEvStore } from '@/store/useEvStore';

const VIOLATION_TYPES = [
  '追高买入', '满仓操作', '未做验证', '情绪下单', '买了禁入品种', '未执行减仓', '无',
];

export function MonthlyReview({ store }: { store: ReturnType<typeof useEvStore> }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const existingReview = store.reviews.find(r => r.month === currentMonth);
  const [step, setStep] = useState(0);
  const [violations, setViolations] = useState(existingReview?.violations ?? '');
  const [violationType, setViolationType] = useState('无');
  const [holdingsNote, setHoldingsNote] = useState('');
  const [plan, setPlan] = useState(existingReview?.nextMonthPlan ?? '');
  const [watchlist, setWatchlist] = useState(existingReview?.watchlist ?? '');
  const [done, setDone] = useState(!!existingReview);

  const handleSubmit = async () => {
    await store.addReview({
      month: currentMonth,
      violations: `[${violationType}] ${violations}`,
      holdingsStatus: { note: holdingsNote, holdings: store.holdings.map(h => ({ symbol: h.symbol, status: h.status })) },
      nextMonthPlan: plan,
      watchlist,
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 text-profit mx-auto mb-2" />
          <div className="text-sm font-mono">本月复盘已完成</div>
        </div>
        {store.reviews.map(r => (
          <div key={r.id} className="bg-card rounded-xl p-3 border border-border space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-sm">
              <span className="font-display font-semibold">{r.month}</span>
            </div>
            {r.violations && <div><span className="text-muted-foreground">违规：</span>{r.violations}</div>}
            {r.nextMonthPlan && <div><span className="text-muted-foreground">下月计划：</span>{r.nextMonthPlan}</div>}
            {r.watchlist && <div><span className="text-muted-foreground">观察名单：</span>{r.watchlist}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1">
        {['违规回顾', '持仓确认', '下月计划', '观察名单'].map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
            <div className={`text-[8px] text-center mt-1 font-mono ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{s}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-primary">Q1：本月有没有违反规则的操作？</div>
          <Select value={violationType} onValueChange={setViolationType}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VIOLATION_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea value={violations} onChange={e => setViolations(e.target.value)} placeholder="详细描述..." className="text-xs min-h-[80px]" />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-primary">Q2：每只持仓的基本面是否有变化？</div>
          {store.holdings.map(h => (
            <div key={h.id} className="bg-card rounded-lg p-2.5 border border-border flex items-center justify-between text-xs font-mono">
              <span>{h.symbol} <span className="text-muted-foreground">{h.name}</span></span>
              <span className={h.status === 'safe' ? 'text-profit' : h.status === 'watch' ? 'text-yellow-400' : 'text-loss'}>
                {h.status === 'safe' ? '✅' : h.status === 'watch' ? '⚠️' : '🔴'}
              </span>
            </div>
          ))}
          <Textarea value={holdingsNote} onChange={e => setHoldingsNote(e.target.value)} placeholder="基本面变化说明..." className="text-xs min-h-[60px]" />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-primary">Q3：下月定投计划</div>
          <Textarea value={plan} onChange={e => setPlan(e.target.value)} placeholder="优先级、金额分配、关注重点..." className="text-xs min-h-[100px]" />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-primary">Q4：新标的观察</div>
          <Textarea value={watchlist} onChange={e => setWatchlist(e.target.value)} placeholder="值得跟踪的新标的及理由..." className="text-xs min-h-[100px]" />
          <Button onClick={handleSubmit} className="w-full text-xs">提交复盘</Button>
        </div>
      )}

      <div className="flex gap-2">
        {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="flex-1 text-xs">上一步</Button>}
        {step < 3 && <Button size="sm" onClick={() => setStep(s => s + 1)} className="flex-1 text-xs">下一步</Button>}
      </div>
    </div>
  );
}

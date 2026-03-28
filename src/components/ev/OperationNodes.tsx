import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { useEvStore, EvHolding } from '@/store/useEvStore';

function NodeRow({ label, price, current, done, color }: { label: string; price?: number; current?: number; done: boolean; color: string }) {
  if (!price) return null;
  const distance = current ? ((current - price) / price * 100) : 0;
  const triggered = current ? current <= price : false;
  const statusLabel = done ? '已执行' : triggered ? '已触发' : '待触发';
  const statusCls = done ? 'text-muted-foreground line-through' : triggered ? 'text-primary font-bold' : 'text-muted-foreground';

  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-mono ${triggered && !done ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30'}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>${price.toFixed(2)}</span>
        {current && <span className="text-[10px]">{distance > 0 ? '+' : ''}{distance.toFixed(1)}%</span>}
        <span className={`text-[10px] ${statusCls}`}>{statusLabel}</span>
      </div>
    </div>
  );
}

function HoldingNodes({ holding, onSave }: { holding: EvHolding; onSave: (id: string, u: Record<string, any>) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [recentHigh, setRecentHigh] = useState(holding.recentHigh?.toString() ?? '');
  const [s1, setS1] = useState(holding.sellTier1Price?.toString() ?? '');
  const [s2, setS2] = useState(holding.sellTier2Price?.toString() ?? '');
  const [s3, setS3] = useState(holding.sellTier3Price?.toString() ?? '');

  const handleSave = () => {
    const rh = parseFloat(recentHigh) || undefined;
    onSave(holding.id, {
      recentHigh: rh,
      buyTier1Price: rh ? +(rh * 0.85).toFixed(2) : undefined,
      buyTier2Price: rh ? +(rh * 0.75).toFixed(2) : undefined,
      buyTier3Price: rh ? +(rh * 0.65).toFixed(2) : undefined,
      sellTier1Price: parseFloat(s1) || undefined,
      sellTier2Price: parseFloat(s2) || undefined,
      sellTier3Price: parseFloat(s3) || undefined,
    });
    setEditing(false);
  };

  const cur = holding.currentPrice;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 text-left">
        <div>
          <span className="text-sm font-display font-semibold">{holding.symbol}</span>
          <span className="text-[10px] text-muted-foreground ml-1.5">{holding.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {cur && <span className="text-xs font-mono">${cur.toFixed(2)}</span>}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-[10px] font-mono text-primary">📉 三档买入节点</div>
          <NodeRow label="第一档 (-15%)" price={holding.buyTier1Price} current={cur} done={false} color="hsl(45,90%,55%)" />
          <NodeRow label="第二档 (-25%)" price={holding.buyTier2Price} current={cur} done={false} color="hsl(30,90%,55%)" />
          <NodeRow label="第三档 (-35%)" price={holding.buyTier3Price} current={cur} done={false} color="hsl(0,70%,50%)" />

          <div className="text-[10px] font-mono text-profit mt-2">📈 三步减仓节点</div>
          <NodeRow label="第一步 (+25%)" price={holding.sellTier1Price} current={cur} done={holding.sellTier1Done} color="hsl(142,70%,45%)" />
          <NodeRow label="第二步 (+50%)" price={holding.sellTier2Price} current={cur} done={holding.sellTier2Done} color="hsl(142,70%,55%)" />
          <NodeRow label="第三步 (+80%)" price={holding.sellTier3Price} current={cur} done={holding.sellTier3Done} color="hsl(142,70%,65%)" />

          <div className="pt-2 border-t border-border">
            {!editing ? (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setEditing(true)}>编辑节点</Button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">近期高点</label>
                    <Input value={recentHigh} onChange={e => setRecentHigh(e.target.value)} className="h-7 text-xs" placeholder="高点价格" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">减仓价格</div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={s1} onChange={e => setS1(e.target.value)} className="h-7 text-xs" placeholder="+25%" />
                  <Input value={s2} onChange={e => setS2(e.target.value)} className="h-7 text-xs" placeholder="+50%" />
                  <Input value={s3} onChange={e => setS3(e.target.value)} className="h-7 text-xs" placeholder="+80%" />
                </div>
                <Button size="sm" className="w-full text-xs gap-1" onClick={handleSave}>
                  <Save className="w-3 h-3" /> 保存
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OperationNodes({ store }: { store: ReturnType<typeof useEvStore> }) {
  if (store.holdings.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">请先在「持仓」页面导入数据</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">
        每只标的的买入/减仓触发节点及当前距离
      </div>
      {store.holdings.map(h => (
        <HoldingNodes key={h.id} holding={h} onSave={store.updateHolding} />
      ))}
    </div>
  );
}

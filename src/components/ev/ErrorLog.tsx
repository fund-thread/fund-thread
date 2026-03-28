import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Plus, Ban } from 'lucide-react';
import type { useEvStore } from '@/store/useEvStore';

const ERROR_TYPES = [
  { key: 'chase_high', label: '追高买入', color: 'hsl(0,70%,50%)' },
  { key: 'full_position', label: '满仓操作', color: 'hsl(30,90%,55%)' },
  { key: 'no_verification', label: '未做验证', color: 'hsl(45,90%,55%)' },
  { key: 'emotional', label: '情绪下单', color: 'hsl(280,70%,60%)' },
  { key: 'banned_asset', label: '买了禁入品种', color: 'hsl(320,70%,50%)' },
  { key: 'missed_sell', label: '未执行减仓', color: 'hsl(200,70%,50%)' },
];

export function ErrorLog({ store }: { store: ReturnType<typeof useEvStore> }) {
  const [adding, setAdding] = useState(false);
  const [errorType, setErrorType] = useState('chase_high');
  const [symbol, setSymbol] = useState('');
  const [loss, setLoss] = useState('');
  const [lesson, setLesson] = useState('');

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    store.errors.filter(e => !e.isRevoked).forEach(e => {
      counts[e.errorType] = (counts[e.errorType] || 0) + 1;
    });
    return ERROR_TYPES.map(t => ({ name: t.label, count: counts[t.key] || 0, color: t.color })).filter(d => d.count > 0);
  }, [store.errors]);

  const handleAdd = async () => {
    if (!lesson) return;
    await store.addError({
      errorType, occurredAt: new Date().toISOString().slice(0, 10),
      symbol: symbol || undefined, lossEstimate: parseFloat(loss) || undefined, lesson,
    });
    setErrorType('chase_high'); setSymbol(''); setLoss(''); setLesson('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-xs font-mono text-muted-foreground mb-2">错误类型分布（下月重点防范）</div>
          <div className="h-36">
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,12%,50%)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(215,12%,50%)' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Error */}
      {!adding ? (
        <Button size="sm" onClick={() => setAdding(true)} className="w-full text-xs gap-1 bg-destructive hover:bg-destructive/90">
          <Plus className="w-3 h-3" /> 记录错误
        </Button>
      ) : (
        <div className="bg-card rounded-xl p-3 border border-loss/30 space-y-2">
          <div className="text-xs font-mono text-loss">记录违规操作</div>
          <Select value={errorType} onValueChange={setErrorType}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ERROR_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-muted-foreground">标的</label><Input value={symbol} onChange={e => setSymbol(e.target.value)} className="h-7 text-xs mt-1" placeholder="可选" /></div>
            <div><label className="text-[10px] text-muted-foreground">损失估算($)</label><Input value={loss} onChange={e => setLoss(e.target.value)} className="h-7 text-xs mt-1" placeholder="可选" /></div>
          </div>
          <Textarea value={lesson} onChange={e => setLesson(e.target.value)} placeholder="教训总结（一句话）..." className="text-xs min-h-[60px]" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)} className="flex-1 text-xs">取消</Button>
            <Button size="sm" onClick={handleAdd} className="flex-1 text-xs bg-destructive hover:bg-destructive/90">记录</Button>
          </div>
        </div>
      )}

      {/* Error List */}
      <div className="space-y-2">
        {store.errors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm font-mono">
            <Ban className="w-8 h-8 mx-auto mb-2 opacity-50" />
            暂无错误记录
          </div>
        )}
        {store.errors.map(e => {
          const typeConfig = ERROR_TYPES.find(t => t.key === e.errorType);
          return (
            <div key={e.id} className={`bg-card rounded-xl p-3 border space-y-1.5 ${e.isRevoked ? 'border-border opacity-50' : 'border-loss/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: typeConfig?.color ?? 'gray' }} />
                  <span className="text-xs font-mono font-semibold" style={{ color: typeConfig?.color }}>{typeConfig?.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{e.occurredAt}</span>
              </div>
              {e.symbol && <div className="text-xs font-mono">标的：{e.symbol}</div>}
              {e.lossEstimate != null && <div className="text-xs font-mono text-loss">损失：${e.lossEstimate}</div>}
              <div className="text-xs font-mono text-muted-foreground">💡 {e.lesson}</div>
              {!e.isRevoked && (
                <Button variant="ghost" size="sm" onClick={() => store.revokeError(e.id)} className="text-[10px] h-6 px-2 text-muted-foreground">
                  标记为已撤销
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

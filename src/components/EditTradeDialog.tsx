import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import type { Trade, TradeDirection, StrategyTag, Currency } from '@/types/trade';
import { STRATEGY_LABELS, CURRENCY_LABELS } from '@/types/trade';

interface Props {
  trade: Trade;
  onUpdate: (id: string, updates: Partial<Pick<Trade, 'symbol' | 'name' | 'direction' | 'buyDate' | 'buyPrice' | 'shares' | 'buyReason' | 'strategy' | 'currency'>>) => void;
}

export function EditTradeDialog({ trade, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    symbol: trade.symbol,
    name: trade.name,
    direction: trade.direction,
    buyDate: trade.buyDate,
    buyPrice: String(trade.buyPrice),
    shares: String(trade.shares),
    buyReason: trade.buyReason,
    strategy: trade.strategy,
    currency: trade.currency,
  });

  const handleOpen = (v: boolean) => {
    if (v) {
      setForm({
        symbol: trade.symbol, name: trade.name, direction: trade.direction,
        buyDate: trade.buyDate, buyPrice: String(trade.buyPrice), shares: String(trade.shares),
        buyReason: trade.buyReason, strategy: trade.strategy, currency: trade.currency,
      });
    }
    setOpen(v);
  };

  const handleSubmit = () => {
    const updates: any = {};
    if (form.symbol !== trade.symbol) updates.symbol = form.symbol;
    if (form.name !== trade.name) updates.name = form.name;
    if (form.direction !== trade.direction) updates.direction = form.direction;
    if (form.buyDate !== trade.buyDate) updates.buyDate = form.buyDate;
    if (Number(form.buyPrice) !== trade.buyPrice) updates.buyPrice = Number(form.buyPrice);
    if (Number(form.shares) !== trade.shares) updates.shares = Number(form.shares);
    if (form.buyReason !== trade.buyReason) updates.buyReason = form.buyReason;
    if (form.strategy !== trade.strategy) updates.strategy = form.strategy;
    if (form.currency !== trade.currency) updates.currency = form.currency;

    if (Object.keys(updates).length > 0) {
      onUpdate(trade.id, updates);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="编辑">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-xl">编辑交易</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>股票代码</Label><Input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} /></div>
            <div><Label>股票名称</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>方向</Label>
              <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v as TradeDirection }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="long">做多</SelectItem><SelectItem value="short">做空</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>策略</Label>
              <Select value={form.strategy} onValueChange={v => setForm(f => ({ ...f, strategy: v as StrategyTag }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STRATEGY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>货币</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v as Currency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CURRENCY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>买入日期</Label><Input type="date" value={form.buyDate} onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))} /></div>
            <div><Label>买入价格</Label><Input type="number" step="0.01" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} /></div>
            <div><Label>股数</Label><Input type="number" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} /></div>
          </div>
          <div><Label>买入理由</Label><Textarea value={form.buyReason} onChange={e => setForm(f => ({ ...f, buyReason: e.target.value }))} rows={3} /></div>
          <Button type="button" onClick={handleSubmit} className="w-full">保存修改</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

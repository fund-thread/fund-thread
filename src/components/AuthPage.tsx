import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('登录成功');
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success('注册成功，请查收验证邮件');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold">
            <span className="text-primary">Trade</span>Journal
          </h1>
          <p className="text-sm text-muted-foreground mt-2">多设备同步的交易记录系统</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 mb-2">
            {(['登录', '注册'] as const).map((label, i) => (
              <button key={label} onClick={() => setIsLogin(i === 0)}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-mono transition-all ${(i === 0) === isLogin ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
          <div><Label>邮箱</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" /></div>
          <div><Label>密码</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">{loading ? '请稍候...' : isLogin ? '登录' : '注册'}</Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm as LoginValues } from '@/lib/validaciones';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { user: '', pass: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'No se pudo iniciar sesión.');
        return;
      }
      // Navegación dura para que el middleware tome la cookie recién creada.
      window.location.assign('/');
    } catch {
      setError('No se pudo conectar. Intentá de nuevo.');
    }
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>
        )}
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="username" placeholder="nombre@horizonte.com" maxLength={254} autoFocus className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pass"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" placeholder="••••••••" maxLength={200} className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="mt-1.5 h-12 w-full text-[15px]">
          {form.formState.isSubmitting ? 'Ingresando…' : 'Entrar'}
        </Button>
      </form>
    </Form>
  );
}

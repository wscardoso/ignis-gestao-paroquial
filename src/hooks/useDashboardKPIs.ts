import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export interface KPIData {
  label: string;
  value: string;
  trend: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

interface UseDashboardKPIsOptions {
  level: 'super' | 'matriz' | 'comunidade' | 'fiel';
  tenantId?: string;
  subTenantId?: string;
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function useDashboardKPIs({ level, tenantId, subTenantId }: UseDashboardKPIsOptions) {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const prevMonthStart = startOfMonth(subMonths(now, 1));
        const prevMonthEnd = endOfMonth(subMonths(now, 1));
        const today = startOfDay(now);
        const todayEnd = endOfDay(now);
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        if (level === 'super') {
          const [tenants, people, aptsThisMonth, aptsLastMonth] = await Promise.all([
            supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('people').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('appointments').select('id', { count: 'exact', head: true })
              .gte('start_time', monthStart.toISOString()).lte('start_time', monthEnd.toISOString()),
            supabase.from('appointments').select('id', { count: 'exact', head: true })
              .gte('start_time', prevMonthStart.toISOString()).lte('start_time', prevMonthEnd.toISOString()),
          ]);

          const totalTenants = tenants.count || 0;
          const totalPeople = people.count || 0;
          const thisMonthApts = aptsThisMonth.count || 0;
          const lastMonthApts = aptsLastMonth.count || 0;
          const pctChange = lastMonthApts > 0 ? Math.round(((thisMonthApts - lastMonthApts) / lastMonthApts) * 100) : 0;

          setKpis([
            { label: 'Paróquias Ativas', value: fmt(totalTenants), trend: 'Ativas no sistema', trendDirection: 'neutral' },
            { label: 'Total de Fiéis', value: fmt(totalPeople), trend: 'Cadastrados', trendDirection: 'neutral' },
            { label: 'Agendamentos (Mês)', value: fmt(thisMonthApts), trend: pctChange >= 0 ? `+${pctChange}% vs mês anterior` : `${pctChange}% vs mês anterior`, trendDirection: pctChange >= 0 ? 'up' : 'down' },
            { label: 'Sacramentos (Mês)', value: '—', trend: 'Em breve', trendDirection: 'neutral' },
          ]);

          // Fetch sacraments count separately
          const sacThisMonth = await supabase.from('sacraments').select('id', { count: 'exact', head: true })
            .gte('celebratory_date', monthStart.toISOString().split('T')[0])
            .lte('celebratory_date', monthEnd.toISOString().split('T')[0]);

          setKpis(prev => prev.map((k, i) => i === 3 ? { ...k, value: fmt(sacThisMonth.count || 0), trend: 'Registrados este mês' } : k));

        } else if (level === 'matriz' && tenantId) {
          const [people, aptsThisMonth, aptsLastMonth, completedThisMonth] = await Promise.all([
            supabase.from('people').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
              .gte('start_time', monthStart.toISOString()).lte('start_time', monthEnd.toISOString()),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
              .gte('start_time', prevMonthStart.toISOString()).lte('start_time', prevMonthEnd.toISOString()),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
              .eq('status', 'completed')
              .gte('start_time', monthStart.toISOString()).lte('start_time', monthEnd.toISOString()),
          ]);

          const totalPeople = people.count || 0;
          const thisMonth = aptsThisMonth.count || 0;
          const lastMonth = aptsLastMonth.count || 0;
          const completed = completedThisMonth.count || 0;
          const pct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
          const occupancy = thisMonth > 0 ? Math.round((completed / thisMonth) * 100) : 0;

          setKpis([
            { label: 'Fiéis Cadastrados', value: fmt(totalPeople), trend: 'No tenant', trendDirection: 'neutral' },
            { label: 'Agendamentos (Mês)', value: fmt(thisMonth), trend: pct >= 0 ? `+${pct}% vs anterior` : `${pct}% vs anterior`, trendDirection: pct >= 0 ? 'up' : 'down' },
            { label: 'Realizados (Mês)', value: fmt(completed), trend: `${occupancy}% taxa`, trendDirection: occupancy > 50 ? 'up' : 'down' },
            { label: 'Sacramenta (Mês)', value: '—', trend: 'Carregando...', trendDirection: 'neutral' },
          ]);

          const sacCount = await supabase.from('sacraments').select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('celebratory_date', monthStart.toISOString().split('T')[0])
            .lte('celebratory_date', monthEnd.toISOString().split('T')[0]);

          setKpis(prev => prev.map((k, i) => i === 3 ? { ...k, value: fmt(sacCount.count || 0), trend: 'Total no mês' } : k));

        } else if (level === 'comunidade' && tenantId) {
          const [aptsToday, aptsWeek, completedWeek] = await Promise.all([
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
              .gte('start_time', today.toISOString()).lte('start_time', todayEnd.toISOString()),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
              .gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString()),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
              .eq('status', 'completed')
              .gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString()),
          ]);

          const todayCount = aptsToday.count || 0;
          const weekCount = aptsWeek.count || 0;
          const completedCount = completedWeek.count || 0;
          const rate = weekCount > 0 ? Math.round((completedCount / weekCount) * 100) : 0;

          setKpis([
            { label: 'Agendamentos Hoje', value: fmt(todayCount), trend: 'Pendentes/Confirmados', trendDirection: 'neutral' },
            { label: 'Agendamentos Semana', value: fmt(weekCount), trend: 'Esta semana', trendDirection: 'neutral' },
            { label: 'Taxa Comparecimento', value: `${rate}%`, trend: `${completedCount} de ${weekCount}`, trendDirection: rate > 60 ? 'up' : 'down' },
            { label: 'Pendentes Hoje', value: fmt(todayCount), trend: 'Aguardando', trendDirection: 'neutral' },
          ]);
        } else {
          setKpis([]);
        }
      } catch (err) {
        console.error('Error loading KPIs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [level, tenantId, subTenantId]);

  return { kpis, isLoading };
}

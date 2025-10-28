import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from './ui/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      iconColor: 'text-white',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-gradient-to-r from-green-500 to-green-600',
      iconColor: 'text-white',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      iconBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      iconColor: 'text-white',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      iconBg: 'bg-gradient-to-r from-red-500 to-red-600',
      iconColor: 'text-white',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      iconColor: 'text-white',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      iconBg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      iconColor: 'text-white',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200'
    },
  };

  const colorConfig = colorClasses[color];

  return (
    <Card className={cn(
      "bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
      colorConfig.bg
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-600 mb-2">{title}</p>
            <p className="text-4xl font-bold text-slate-800 mb-2">{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                <span className={cn(
                  'text-sm font-semibold',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-slate-500">so với tháng trước</span>
              </div>
            )}
          </div>
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg',
            colorConfig.iconBg
          )}>
            <Icon className={cn("w-8 h-8", colorConfig.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

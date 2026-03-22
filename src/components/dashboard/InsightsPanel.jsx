import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Brain,
    CheckCircle,
    BookOpen,
    Target,
    AlertCircle,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * InsightsPanel Component
 * Displays prioritized insights about user study behavior
 * Matches the design from user's screenshots
 */
export default function InsightsPanel({ insights = [] }) {
    if (!insights || insights.length === 0) {
        return (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100">
                <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-slate-600">
                        Complete some quizzes or activities to get personalized insights!
                    </p>
                </div>
            </Card>
        );
    }

    const getIconComponent = (iconName) => {
        const icons = {
            brain: Brain,
            checkCircle: CheckCircle,
            bookOpen: BookOpen,
            target: Target,
            alertCircle: AlertCircle,
            alertTriangle: AlertTriangle,
            trendingUp: TrendingUp
        };
        return icons[iconName] || Brain;
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'high':
                return {
                    bg: 'bg-gradient-to-br from-red-50 to-orange-50',
                    border: 'border-red-200',
                    iconBg: 'bg-red-100',
                    iconText: 'text-red-600',
                    badge: 'bg-red-100 text-red-700 border-red-200'
                };
            case 'medium':
                return {
                    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
                    border: 'border-amber-200',
                    iconBg: 'bg-amber-100',
                    iconText: 'text-amber-600',
                    badge: 'bg-amber-100 text-amber-700 border-amber-200'
                };
            case 'low':
            default:
                return {
                    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
                    border: 'border-emerald-200',
                    iconBg: 'bg-emerald-100',
                    iconText: 'text-emerald-600',
                    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
                };
        }
    };

    return (
        <div className="space-y-4">
            {insights.map((insight, index) => {
                const Icon = getIconComponent(insight.icon);
                const styles = getPriorityStyles(insight.priority);

                return (
                    <Card
                        key={index}
                        className={cn(
                            'p-5 border-2 transition-all hover:shadow-lg',
                            styles.bg,
                            styles.border
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                                styles.iconBg
                            )}>
                                <Icon className={cn('w-6 h-6', styles.iconText)} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-slate-900">{insight.title}</h4>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    {insight.description}
                                </p>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

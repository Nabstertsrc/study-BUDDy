import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Lightbulb,
    ExternalLink,
    BookOpen,
    FileText,
    PlayCircle,
    Globe,
    Plus,
    X,
    Loader2,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

/**
 * RecommendationsPanel Component
 * Displays all recommendation types matching user's screenshots:
 * - Complex Topics Explained
 * - Advanced Learning Resources
 * - Recommended for You (module materials)
 */
export default function RecommendationsPanel({
    complexTopics = [],
    externalResources = [],
    recommendedMaterials = [],
    modules = [],
    onGenerateTutorial,
    generatingTutorial = null,
    tutorials = {}
}) {
    const getResourceIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'video':
                return PlayCircle;
            case 'website':
                return Globe;
            case 'pdf':
            case 'module material':
                return FileText;
            default:
                return BookOpen;
        }
    };

    return (
        <div className="space-y-6">
            {/* Complex Topics Explained */}
            {complexTopics && complexTopics.length > 0 && (
                <Card className="p-6 bg-white border-2 border-amber-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Lightbulb className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">
                                Complex Topics Explained 💡
                            </h3>
                            <p className="text-sm text-slate-500">
                                Get AI-generated tutorials for challenging concepts
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {complexTopics.map((topic, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 hover:border-amber-300 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-slate-900">
                                                {topic.topic}
                                            </h4>
                                            {topic.moduleCode && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-white border-amber-300"
                                                >
                                                    {topic.moduleCode}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {topic.reason}
                                        </p>
                                    </div>
                                    {onGenerateTutorial && (
                                        <Button
                                            size="sm"
                                            onClick={() => onGenerateTutorial(topic.topic, topic.reason)}
                                            disabled={generatingTutorial === topic.topic}
                                            className={cn(
                                                "ml-4 flex-shrink-0 min-w-[140px]",
                                                tutorials[topic.topic]
                                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                                    : "bg-amber-600 hover:bg-amber-700"
                                            )}
                                        >
                                            {generatingTutorial === topic.topic ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Neural Lab...
                                                </>
                                            ) : tutorials[topic.topic] ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    View Tutorial
                                                </>
                                            ) : (
                                                <>
                                                    <Lightbulb className="w-4 h-4 mr-2" />
                                                    Generate Tutorial
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Advanced Learning Resources */}
            {externalResources && externalResources.length > 0 && (
                <Card className="p-6 bg-white border-2 border-purple-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                            <Globe className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">
                                Advanced Learning Resources 🌐
                            </h3>
                            <p className="text-sm text-slate-500">
                                Curated external resources to deepen your understanding
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {externalResources.map((resource, index) => {
                            const Icon = getResourceIcon(resource.type);
                            return (
                                <a
                                    key={index}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 hover:shadow-md transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                                        <Icon className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                                                {resource.title}
                                            </h4>
                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">
                                            {resource.description}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-white border-purple-300"
                                        >
                                            {resource.type}
                                        </Badge>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Recommended for You (Module Materials) */}
            {recommendedMaterials && recommendedMaterials.length > 0 && (
                <Card className="p-6 bg-white border-2 border-blue-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">
                                Recommended for You 📚
                            </h3>
                            <p className="text-sm text-slate-500">
                                AI-suggested resources based on your progress
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {recommendedMaterials.map((material, index) => {
                            const module = modules?.find(m => m.id === material.moduleId);
                            return (
                                <div
                                    key={index}
                                    className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 hover:border-blue-300 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-slate-900 flex-1">
                                            {material.title}
                                        </h4>
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-white border-blue-300 flex-shrink-0 ml-2"
                                        >
                                            {material.type}
                                        </Badge>
                                    </div>
                                    {module && (
                                        <Badge className="bg-blue-600 text-white mb-2 text-xs">
                                            {module.code}
                                        </Badge>
                                    )}
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {material.reason}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Empty state */}
            {(!complexTopics || complexTopics.length === 0) &&
                (!externalResources || externalResources.length === 0) &&
                (!recommendedMaterials || recommendedMaterials.length === 0) && (
                    <Card className="p-12 bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200">
                        <div className="text-center">
                            <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-bold text-lg text-slate-900 mb-2">
                                No Recommendations Yet
                            </h3>
                            <p className="text-slate-600 mb-6">
                                Complete some quizzes or learning activities to get personalized recommendations!
                            </p>
                            <Link to={createPageUrl('StudyLab')}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Go to Study Lab
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </Card>
                )}
        </div>
    );
}

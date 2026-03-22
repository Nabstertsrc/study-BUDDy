import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function PrescribedBooks() {
  const [selectedModule, setSelectedModule] = React.useState("all");

  const { data: books, isLoading } = useQuery({
    queryKey: ["prescribed-books"],
    queryFn: () => base44.entities.PrescribedBook.list("-created_date"),
  });

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list(),
  });

  const filteredBooks = books?.filter(book =>
    selectedModule === "all" || book.module_id === selectedModule
  ) || [];

  const getModuleInfo = (moduleId) => {
    return modules?.find(m => m.id === moduleId);
  };

  const booksByModule = filteredBooks.reduce((acc, book) => {
    const moduleId = book.module_id || "unassigned";
    if (!acc[moduleId]) acc[moduleId] = [];
    acc[moduleId].push(book);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium">Resource Library</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Prescribed Books
          </h1>
          <p className="text-slate-500 mt-1">
            All prescribed textbooks and resources from your modules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules?.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Books</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{books?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">With Resources</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {books?.filter(b => b.resources && b.resources.length > 0).length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Modules Covered</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {new Set(books?.map(b => b.module_id).filter(Boolean)).size || 0}
          </p>
        </Card>
      </div>

      {/* Books by Module */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">Loading books...</p>
        </Card>
      ) : filteredBooks.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Books Yet</h3>
          <p className="text-slate-500">
            Upload course documents to automatically detect prescribed books
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(booksByModule).map(([moduleId, moduleBooks]) => {
            const module = getModuleInfo(moduleId);
            return (
              <Card key={moduleId} className="p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                  {module ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {module.code.substring(0, 2)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{module.code}</h2>
                        <p className="text-sm text-slate-600">{module.title}</p>
                      </div>
                      <Badge className="ml-auto">{moduleBooks.length} books</Badge>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        ?
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Unassigned</h2>
                        <p className="text-sm text-slate-600">No module specified</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">{moduleBooks.length} books</Badge>
                    </>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {moduleBooks.map((book) => (
                    <div key={book.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{book.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {book.author}
                            {book.edition && ` • ${book.edition}`}
                          </p>
                          {book.source_document && (
                            <p className="text-xs text-slate-500 mt-1">
                              From: {book.source_document}
                            </p>
                          )}

                          {book.resources && book.resources.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-700">
                                  Free Resources ({book.resources?.length || 0}):
                                </p>
                                <a
                                  href={`https://libgen.rs/search.php?req=${encodeURIComponent(book.title + ' ' + book.author)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Search LibGen.rs
                                </a>
                              </div>
                              {book.resources.map((resource, idx) => (
                                <a
                                  key={idx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-2 p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-slate-200 group"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-blue-700 group-hover:text-blue-800 truncate">
                                      {resource.source}
                                    </p>
                                    <p className="text-xs text-slate-600 line-clamp-1">
                                      {resource.description}
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}

                          {(!book.resources || book.resources.length === 0) && (
                            <div className="mt-3 flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700">
                                No free resources found
                              </p>
                              <a
                                href={`https://libgen.rs/search.php?req=${encodeURIComponent(book.title + ' ' + book.author)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-amber-200 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Search LibGen
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
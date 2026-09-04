import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Building2, FolderKanban, Users, Zap } from "lucide-react";
import { apiGet } from "@/lib/api";
import { timeAgo } from "@/lib/helpers";
import type { SearchResultResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StudentCard } from "@/pages/Discover";
import { EmptyState, LoadingState } from "@/components/States";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [input, setInput] = useState(q);

  useEffect(() => setInput(q), [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", q],
    queryFn: () => apiGet<SearchResultResponse>(`/search/global?q=${encodeURIComponent(q)}`),
  });

  const total =
    (data?.students.length ?? 0) +
    (data?.colleges.length ?? 0) +
    (data?.projects.length ?? 0) +
    (data?.posts.length ?? 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 data-testid="search-heading" className="font-heading text-2xl font-bold tracking-tight">
          Search
        </h1>
        <p className="mt-1 text-sm text-slate-400">Students, campuses, projects and posts — all in one place.</p>
      </div>

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchParams(input.trim() ? { q: input.trim() } : {});
        }}
      >
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          data-testid="search-page-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search anything on Unisphere…"
          className="h-12 pl-10 text-sm"
        />
      </form>

      {q && (
        <p data-testid="search-result-summary" className="text-xs text-slate-500">
          {isLoading ? "Searching…" : `${total} results for "${q}"`}
        </p>
      )}

      {isLoading ? (
        <LoadingState label="Searching across the network…" />
      ) : total === 0 ? (
        <EmptyState
          testId="search-empty-state"
          title={q ? `No results for "${q}"` : "Start typing to search"}
          description="Try a skill like 'PyTorch', a campus like 'MIT', or a student's name."
          icon={<SearchIcon className="size-6" />}
        />
      ) : (
        <Tabs defaultValue="students">
          <TabsList variant="line" className="w-full overflow-x-auto" data-testid="search-tabs">
            <TabsTrigger value="students" data-testid="search-tab-students">
              <Users className="mr-1.5 size-3.5" /> Students ({data!.students.length})
            </TabsTrigger>
            <TabsTrigger value="colleges" data-testid="search-tab-colleges">
              <Building2 className="mr-1.5 size-3.5" /> Colleges ({data!.colleges.length})
            </TabsTrigger>
            <TabsTrigger value="projects" data-testid="search-tab-projects">
              <FolderKanban className="mr-1.5 size-3.5" /> Projects ({data!.projects.length})
            </TabsTrigger>
            <TabsTrigger value="posts" data-testid="search-tab-posts">
              <Zap className="mr-1.5 size-3.5" /> Posts ({data!.posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-5">
            {data!.students.length === 0 ? (
              <EmptyState testId="search-students-empty" title="No matching students" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data!.students.map((s) => (
                  <StudentCard key={s.id} student={s} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="colleges" className="mt-5">
            {data!.colleges.length === 0 ? (
              <EmptyState testId="search-colleges-empty" title="No matching colleges" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data!.colleges.map((c) => (
                  <Link
                    key={c.id}
                    to={`/communities?id=${c.id}`}
                    data-testid={`search-college-${c.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.short_name}</p>
                      <p className="truncate text-[11px] text-slate-500">{c.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-5 space-y-3">
            {data!.projects.length === 0 ? (
              <EmptyState testId="search-projects-empty" title="No matching projects" />
            ) : (
              data!.projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects?id=${p.id}`}
                  data-testid={`search-project-${p.id}`}
                  className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-violet-500/25"
                >
                  <Badge className="mb-2 border-0 bg-amber-500/10 text-[10px] text-amber-300">{p.category}</Badge>
                  <p className="font-heading text-base font-semibold">{p.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{p.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {p.technologies.slice(0, 5).map((t) => (
                      <span key={t} className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-slate-300">{t}</span>
                    ))}
                  </div>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-5 space-y-3">
            {data!.posts.length === 0 ? (
              <EmptyState testId="search-posts-empty" title="No matching posts" />
            ) : (
              data!.posts.map((p) => (
                <Link
                  key={p.id}
                  to="/feed"
                  data-testid={`search-post-${p.id}`}
                  className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-violet-500/25"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={p.author_avatar} name={p.author_name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{p.author_name}</p>
                      <p className="truncate text-[10px] text-slate-500">
                        {p.author_college} · {timeAgo(p.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-3 text-sm text-slate-300">{p.content}</p>
                </Link>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

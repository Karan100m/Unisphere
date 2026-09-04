import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, MapPin, Users, CalendarDays, ArrowLeft, Check, Plus } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { getErrorMessage } from "@/lib/helpers";
import type { CollegeResponse, UserResponse, PostResponse, ProjectResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/PostCard";
import { EmptyState, LoadingState } from "@/components/States";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Communities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("id");
  const queryClient = useQueryClient();

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ["colleges"],
    queryFn: () => apiGet<CollegeResponse[]>("/colleges"),
  });

  const { data: college } = useQuery({
    queryKey: ["college", activeId],
    queryFn: () => apiGet<CollegeResponse>(`/colleges/${activeId}`),
    enabled: !!activeId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["college-students", activeId],
    queryFn: () => apiGet<UserResponse[]>(`/colleges/${activeId}/students`),
    enabled: !!activeId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "college", college?.name],
    queryFn: () => apiGet<PostResponse[]>(`/posts?college=${encodeURIComponent(college!.name)}`),
    enabled: !!college?.name,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => apiGet<ProjectResponse[]>("/projects"),
    enabled: !!activeId,
  });

  const followMutation = useMutation({
    mutationFn: (id: string) => apiPost<{ is_following: boolean }>(`/colleges/${id}/follow`),
    onSuccess: (d) => {
      toast.success(d.is_following ? "Following this campus community" : "Unfollowed");
      void queryClient.invalidateQueries({ queryKey: ["colleges"] });
      void queryClient.invalidateQueries({ queryKey: ["college", activeId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ---------- DETAIL VIEW ----------
  if (activeId && college) {
    const collegeProjects = projects.filter((p) => p.owner_college === college.name);

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <button
          data-testid="community-back-btn"
          onClick={() => setSearchParams({})}
          className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors duration-200 hover:text-violet-300"
        >
          <ArrowLeft className="size-4" /> All communities
        </button>

        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
          <div className="relative h-36 sm:h-48">
            {college.banner_url ? (
              <img src={college.banner_url} alt={college.name} className="size-full object-cover opacity-70" />
            ) : (
              <div className="size-full bg-gradient-to-br from-violet-600/30 to-amber-500/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#16101F] to-transparent" />
          </div>

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-8 flex flex-wrap items-end gap-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#16101F] text-violet-400">
                <Building2 className="size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 data-testid="community-name" className="font-heading text-2xl font-bold tracking-tight">
                  {college.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin className="size-3.5" /> {college.location}
                </p>
              </div>
              <Button
                size="sm"
                variant={college.is_following ? "outline" : "default"}
                data-testid="community-follow-btn"
                onClick={() => followMutation.mutate(college.id)}
              >
                {college.is_following ? (
                  <><Check className="mr-1.5 size-3.5" /> Following</>
                ) : (
                  <><Plus className="mr-1.5 size-3.5" /> Follow</>
                )}
              </Button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{college.about}</p>

            <div className="mt-5 flex flex-wrap gap-5 border-t border-white/[0.06] pt-4">
              <div>
                <p data-testid="community-student-count" className="font-heading text-lg font-bold">
                  {college.student_count.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">Students</p>
              </div>
              <div>
                <p data-testid="community-followers-count" className="font-heading text-lg font-bold">
                  {college.followers_count.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">Followers</p>
              </div>
              <div>
                <p className="font-heading text-lg font-bold">{students.length}</p>
                <p className="text-[11px] text-slate-500">On Unisphere</p>
              </div>
            </div>

            {college.departments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {college.departments.map((d) => (
                  <span key={d} className="rounded-full bg-violet-500/[0.09] px-2.5 py-1 text-[11px] text-violet-300">{d}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="students">
          <TabsList variant="line" className="w-full overflow-x-auto" data-testid="community-tabs">
            <TabsTrigger value="students" data-testid="community-tab-students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="posts" data-testid="community-tab-posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="events" data-testid="community-tab-events">Events ({college.events.length})</TabsTrigger>
            <TabsTrigger value="projects" data-testid="community-tab-projects">Projects ({collegeProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-5">
            {students.length === 0 ? (
              <EmptyState testId="community-students-empty" title="No students from this campus yet" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {students.map((s) => (
                  <Link
                    key={s.id}
                    to={`/profile/${s.id}`}
                    data-testid={`community-student-${s.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
                  >
                    <Avatar src={s.avatar_url} name={s.full_name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.full_name}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {s.degree} {s.branch} · {s.current_year}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-5 space-y-4">
            {posts.length === 0 ? (
              <EmptyState testId="community-posts-empty" title="No posts from this campus yet" />
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-5 space-y-3">
            {college.events.length === 0 ? (
              <EmptyState
                testId="community-events-empty"
                title="No upcoming events"
                icon={<CalendarDays className="size-6" />}
              />
            ) : (
              college.events.map((e) => (
                <div
                  key={e.title}
                  data-testid={`community-event-${e.title.replace(/\s+/g, "-").toLowerCase()}`}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold">{e.title}</h3>
                    <Badge className="border-0 bg-fuchsia-500/15 text-[10px] text-fuchsia-300">{e.type}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-violet-400">{e.date}</p>
                  <p className="mt-2.5 text-sm text-slate-400">{e.description}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="size-3" /> {e.location}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-5 space-y-3">
            {collegeProjects.length === 0 ? (
              <EmptyState testId="community-projects-empty" title="No projects from this campus yet" />
            ) : (
              collegeProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects?id=${p.id}`}
                  data-testid={`community-project-${p.id}`}
                  className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-violet-500/25"
                >
                  <Badge className="mb-2 border-0 bg-amber-500/10 text-[10px] text-amber-300">{p.category}</Badge>
                  <p className="font-heading text-sm font-semibold">{p.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{p.description}</p>
                </Link>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  return (
    <div className="space-y-5">
      <div>
        <h1 data-testid="communities-heading" className="font-heading text-2xl font-bold tracking-tight">
          College Communities
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Follow campuses to see their students, projects and events in one hub.
        </p>
      </div>

      {isLoading ? (
        <LoadingState label="Loading communities…" />
      ) : colleges.length === 0 ? (
        <EmptyState testId="communities-empty" title="No communities yet" icon={<Building2 className="size-6" />} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {colleges.map((c) => (
            <div
              key={c.id}
              data-testid={`community-card-${c.id}`}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-colors duration-300 hover:border-violet-500/25"
            >
              <button onClick={() => setSearchParams({ id: c.id })} className="block w-full text-left">
                <div className="relative h-28">
                  {c.banner_url ? (
                    <img src={c.banner_url} alt={c.name} loading="lazy" className="size-full object-cover opacity-70" />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-violet-600/30 to-amber-500/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16101F] to-transparent" />
                </div>
                <div className="p-5">
                  <h2 data-testid={`community-card-name-${c.id}`} className="font-heading text-base font-semibold">
                    {c.short_name}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.location}</p>
                  <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{c.about}</p>
                  <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Users className="size-3" /> {c.student_count.toLocaleString()}</span>
                    <span>{c.followers_count.toLocaleString()} followers</span>
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {c.events.length} events</span>
                  </div>
                </div>
              </button>
              <div className="px-5 pb-5">
                <Button
                  size="sm"
                  variant={c.is_following ? "outline" : "default"}
                  className="w-full"
                  data-testid={`community-follow-btn-${c.id}`}
                  onClick={() => followMutation.mutate(c.id)}
                >
                  {c.is_following ? (
                    <><Check className="mr-1.5 size-3.5" /> Following</>
                  ) : (
                    <><Plus className="mr-1.5 size-3.5" /> Follow campus</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

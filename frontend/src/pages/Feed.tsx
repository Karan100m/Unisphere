import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Send, Bookmark } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, POST_CATEGORIES } from "@/lib/helpers";
import type { PostResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PostCard } from "@/components/PostCard";
import { StoryRibbon } from "@/components/StoryRibbon";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/States";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

export default function Feed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);

  const [draft, setDraft] = useState({
    content: "",
    category: "general",
    tags: "",
    media_url: "",
    media_type: "none" as "none" | "image" | "video",
  });

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setComposerOpen(true);
      searchParams.delete("create");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ["posts", tab],
    queryFn: () => apiGet<PostResponse[]>(`/posts?category=${tab}`),
  });

  const { data: saved } = useQuery({
    queryKey: ["bookmarked-posts"],
    queryFn: () => apiGet<PostResponse[]>("/posts/bookmarked"),
    enabled: tab === "saved",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<PostResponse>("/posts", {
        content: draft.content,
        category: draft.category,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        media_url: draft.media_url,
        media_type: draft.media_url ? draft.media_type === "none" ? "image" : draft.media_type : "none",
      }),
    onSuccess: () => {
      toast.success("Your post is live on the feed!");
      setDraft({ content: "", category: "general", tags: "", media_url: "", media_type: "none" });
      setComposerOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const list = tab === "saved" ? (saved ?? []) : (posts ?? []);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 data-testid="feed-heading" className="font-heading text-2xl font-bold tracking-tight">
          Campus Feed
        </h1>
        <p className="mt-1 text-sm text-slate-400">Projects, wins, questions and student life across campuses.</p>
      </div>

      <StoryRibbon />

      {/* COMPOSER */}
      <div data-testid="post-composer" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex gap-3">
          <Avatar src={user?.avatar_url} name={user?.full_name ?? "You"} size="md" />
          {composerOpen ? (
            <div className="min-w-0 flex-1 space-y-3">
              <Textarea
                data-testid="post-content-input"
                autoFocus
                value={draft.content}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                placeholder="Share a project update, a win, a question or a hackathon call…"
                rows={4}
              />
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Select value={draft.category} onValueChange={(v: string) => setDraft((d) => ({ ...d, category: v }))}>
                  <SelectTrigger data-testid="post-category-select">
                    <SelectValue>
                      {(v) => POST_CATEGORIES.find((c) => c.value === v)?.label ?? "Student Life"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  data-testid="post-tags-input"
                  value={draft.tags}
                  onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                  placeholder="Tags: AI/ML, Hackathon"
                />
              </div>
              <div className="relative">
                <ImagePlus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  data-testid="post-media-url-input"
                  value={draft.media_url}
                  onChange={(e) => setDraft((d) => ({ ...d, media_url: e.target.value }))}
                  placeholder="Optional image or video URL"
                  className="pl-9"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" data-testid="post-cancel-btn" onClick={() => setComposerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  data-testid="post-submit-btn"
                  disabled={createMutation.isPending || !draft.content.trim()}
                  onClick={() => createMutation.mutate()}
                >
                  <Send className="mr-1.5 size-3.5" />
                  {createMutation.isPending ? "Posting…" : "Post"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              data-testid="post-composer-open-btn"
              onClick={() => setComposerOpen(true)}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left text-sm text-slate-500 transition-colors duration-200 hover:border-violet-500/40 hover:text-slate-300"
            >
              What are you building today, {user?.full_name.split(" ")[0]}?
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="w-full overflow-x-auto" data-testid="feed-filter-tabs">
          <TabsTrigger value="all" data-testid="feed-tab-all">All</TabsTrigger>
          <TabsTrigger value="project" data-testid="feed-tab-project">Projects</TabsTrigger>
          <TabsTrigger value="achievement" data-testid="feed-tab-achievement">Wins</TabsTrigger>
          <TabsTrigger value="question" data-testid="feed-tab-question">Questions</TabsTrigger>
          <TabsTrigger value="hackathon" data-testid="feed-tab-hackathon">Hackathons</TabsTrigger>
          <TabsTrigger value="saved" data-testid="feed-tab-saved">
            <Bookmark className="mr-1 size-3.5" /> Saved
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* POSTS */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <ErrorState message="We couldn't load the feed. Please check your connection and try again." />
        ) : list.length === 0 ? (
          <EmptyState
            testId="feed-empty-state"
            title={tab === "saved" ? "No saved posts yet" : "No posts in this category yet"}
            description={
              tab === "saved"
                ? "Bookmark posts you want to revisit and they'll show up here."
                : "Be the first to share something with your campus network."
            }
            action={
              tab !== "saved" && (
                <Button size="sm" data-testid="feed-empty-create-btn" onClick={() => setComposerOpen(true)}>
                  Create a post
                </Button>
              )
            }
          />
        ) : (
          list.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}

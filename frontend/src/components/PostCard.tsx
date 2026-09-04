import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Heart, MessageCircle, Share2, Bookmark, Trash2, Flag, MoreHorizontal, Send,
} from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, getErrorMessage } from "@/lib/helpers";
import type { PostResponse, CommentResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReportDialog } from "@/components/ReportDialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  project: "bg-violet-500/15 text-violet-300",
  achievement: "bg-amber-500/15 text-amber-300",
  event: "bg-amber-500/15 text-amber-300",
  hackathon: "bg-fuchsia-500/15 text-fuchsia-300",
  internship: "bg-emerald-500/15 text-emerald-300",
  question: "bg-rose-500/15 text-rose-300",
  general: "bg-white/[0.06] text-slate-300",
};

export function PostCard({ post }: { post: PostResponse }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["posts"] });
    void queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] });
  };

  const likeMutation = useMutation({
    mutationFn: () => apiPost<{ liked: boolean; likes_count: number }>(`/posts/${post.id}/like`),
    onSuccess: invalidate,
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => apiPost<{ bookmarked: boolean }>(`/posts/${post.id}/bookmark`),
    onSuccess: (d) => {
      toast.success(d.bookmarked ? "Saved to your bookmarks" : "Removed from bookmarks");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/posts/${post.id}`),
    onSuccess: () => {
      toast.success("Post deleted");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => apiGet<CommentResponse[]>(`/posts/${post.id}/comments`),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: () => apiPost<CommentResponse>(`/posts/${post.id}/comments`, { content: commentText }),
    onSuccess: () => {
      setCommentText("");
      void queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const isMine = user?.id === post.author_id;

  return (
    <article
      data-testid={`post-card-${post.id}`}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-white/[0.12] sm:p-6"
    >
      <header className="flex items-start gap-3">
        <Link to={`/profile/${post.author_id}`} data-testid={`post-author-link-${post.id}`}>
          <Avatar src={post.author_avatar} name={post.author_name} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${post.author_id}`}
            data-testid={`post-author-name-${post.id}`}
            className="font-heading text-sm font-semibold hover:text-violet-300"
          >
            {post.author_name}
          </Link>
          <p className="truncate text-xs text-slate-400">{post.author_college}</p>
          <p className="text-[11px] text-slate-500">
            {post.author_degree_year} · {timeAgo(post.created_at)}
          </p>
        </div>

        <Badge className={cn("shrink-0 border-0 text-[10px]", CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.general)}>
          {post.category}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid={`post-menu-btn-${post.id}`}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-white/[0.06] hover:text-slate-200"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-dropdown">
            {isMine ? (
              <DropdownMenuItem
                variant="destructive"
                data-testid={`post-delete-btn-${post.id}`}
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2 className="mr-2 size-4" /> Delete post
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem data-testid={`post-report-btn-${post.id}`} onClick={() => setReportOpen(true)}>
                <Flag className="mr-2 size-4" /> Report post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <p data-testid={`post-content-${post.id}`} className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
        {post.content}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-violet-500/[0.08] px-2 py-0.5 text-[11px] text-violet-300">
              #{t}
            </span>
          ))}
        </div>
      )}

      {post.media_url && post.media_type === "image" && (
        <img
          src={post.media_url}
          alt="Post media"
          loading="lazy"
          data-testid={`post-media-${post.id}`}
          className="mt-4 aspect-video w-full rounded-xl border border-white/[0.06] object-cover"
        />
      )}
      {post.media_url && post.media_type === "video" && (
        <video
          src={post.media_url}
          controls
          data-testid={`post-video-${post.id}`}
          className="mt-4 aspect-video w-full rounded-xl border border-white/[0.06]"
        />
      )}

      <footer className="mt-4 flex items-center gap-1 border-t border-white/[0.06] pt-3">
        <button
          data-testid={`post-like-btn-${post.id}`}
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
            post.is_liked_by_me ? "text-rose-400" : "text-slate-400 hover:bg-white/[0.05] hover:text-rose-400",
          )}
        >
          <Heart className={cn("size-4 transition-transform duration-200", post.is_liked_by_me && "fill-current scale-110")} />
          <span data-testid={`post-like-count-${post.id}`}>{post.likes_count}</span>
        </button>

        <button
          data-testid={`post-comment-toggle-${post.id}`}
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-white/[0.05] hover:text-violet-300"
        >
          <MessageCircle className="size-4" />
          <span data-testid={`post-comment-count-${post.id}`}>{post.comments_count}</span>
        </button>

        <button
          data-testid={`post-share-btn-${post.id}`}
          onClick={() => {
            void navigator.clipboard?.writeText(`${window.location.origin}/feed?post=${post.id}`);
            toast.success("Post link copied to your clipboard");
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-white/[0.05] hover:text-amber-300"
        >
          <Share2 className="size-4" />
          <span>{post.shares_count}</span>
        </button>

        <button
          data-testid={`post-bookmark-btn-${post.id}`}
          onClick={() => bookmarkMutation.mutate()}
          className={cn(
            "ml-auto grid size-8 place-items-center rounded-lg transition-colors duration-200",
            post.is_bookmarked_by_me ? "text-amber-400" : "text-slate-400 hover:bg-white/[0.05] hover:text-amber-400",
          )}
        >
          <Bookmark className={cn("size-4", post.is_bookmarked_by_me && "fill-current")} />
        </button>
      </footer>

      {showComments && (
        <div data-testid={`post-comments-section-${post.id}`} className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              commentMutation.mutate();
            }}
          >
            <Input
              data-testid={`post-comment-input-${post.id}`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a thoughtful comment…"
              className="h-9 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              data-testid={`post-comment-submit-${post.id}`}
              disabled={commentMutation.isPending || !commentText.trim()}
            >
              <Send className="size-3.5" />
            </Button>
          </form>

          {commentsLoading ? (
            <p className="text-xs text-slate-500">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p data-testid={`post-comments-empty-${post.id}`} className="py-2 text-xs text-slate-500">
              No comments yet. Be the first to respond.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} data-testid={`comment-item-${c.id}`} className="flex gap-2.5">
                <Avatar src={c.user_avatar} name={c.user_name} size="xs" />
                <div className="min-w-0 flex-1 rounded-xl bg-white/[0.03] px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <Link to={`/profile/${c.user_id}`} className="text-xs font-semibold hover:text-violet-300">
                      {c.user_name}
                    </Link>
                    <span className="text-[10px] text-slate-500">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={post.id}
        targetLabel={`Post by ${post.author_name}`}
      />
    </article>
  );
}

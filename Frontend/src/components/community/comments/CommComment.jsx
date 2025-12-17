// src/components/community/comments/CommComment.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft } from "lucide-react";
import { getMessageComments, getCommunityMessages } from "@/api/community";
import { socket } from "../../../../Socket.js"; // ✅ Using your existing socket
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";
import toast from "react-hot-toast";

const timeAgo = (timestamp) => {
  const diff = (Date.now() - new Date(timestamp)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function CommComment() {
  const { messageId, communityId } = useParams();
  const navigate = useNavigate();

  const userProfile = useSelector((s) => s.auth.userProfile);
  const messages = useSelector((s) => s.community.messages);
  const selectedMessage = useSelector((s) => s.community.selectedMessage);

  const [message, setMessage] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* MESSAGE RESOLUTION */
  useEffect(() => {
    if (selectedMessage?._id === messageId) {
      setMessage(selectedMessage);
      return;
    }

    const fromStore = messages.find((m) => m._id === messageId);
    if (fromStore) {
      setMessage(fromStore);
      return;
    }

    // Fallback: fetch message
    (async () => {
      try {
        const res = await getCommunityMessages(communityId, { limit: 500 });
        const msg = res.data.data.messages?.find((m) => m._id === messageId);
        if (msg) setMessage(msg);
        else toast.error("Message not found");
      } catch {
        toast.error("Failed to load message");
      }
    })();
  }, [messageId, communityId, selectedMessage, messages]);

  /* LOAD COMMENTS */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMessageComments(messageId);
        setComments(res.data.data.comments || []);
      } catch {
        toast.error("Failed to load comments");
      } finally {
        setLoading(false);
      }
    })();
  }, [messageId]);

  /* SOCKET: JOIN MESSAGE ROOM */
  useEffect(() => {
    if (!messageId || !socket.connected) return;

    // Join message room
    socket.emit("message:join", messageId);
    console.log(`📨 Joined message room: ${messageId}`);

    // Handler for new comments
    const onNew = ({ comment }) => {
      if (comment.message !== messageId) return;

      // 🔥 FIX: Check if comment already exists before adding
      setComments((prev) => {
        const exists = prev.some((c) => c._id === comment._id);
        if (exists) {
          console.log("⏭️ Comment already exists, skipping:", comment._id);
          return prev;
        }
        console.log("✅ Adding new comment:", comment._id);
        return [comment, ...prev];
      });
    };

    // Handler for reactions
    const onReaction = ({ commentId, reactions }) => {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, reactions } : c))
      );
    };

    // Handler for deletions
    const onDelete = ({ commentId }) => {
      setComments((prev) => {
        // Mark for fade-out
        const updated = prev.map((c) =>
          c._id === commentId ? { ...c, _remove: true } : c
        );
        // Remove after animation
        setTimeout(() => {
          setComments((p) => p.filter((c) => c._id !== commentId));
        }, 300);
        return updated;
      });
    };

    socket.on("community:comment:new", onNew);
    socket.on("community:comment:reaction", onReaction);
    socket.on("community:comment:deleted", onDelete);

    return () => {
      socket.emit("message:leave", messageId);
      socket.off("community:comment:new", onNew);
      socket.off("community:comment:reaction", onReaction);
      socket.off("community:comment:deleted", onDelete);
      console.log(`📤 Left message room: ${messageId}`);
    };
  }, [messageId]);

  /* POLLING FALLBACK FOR COMMENTS (20 seconds) */
  useEffect(() => {
    if (!messageId) return;

    const refetchComments = async () => {
      try {
        const res = await getMessageComments(messageId);
        const freshComments = res.data.data.comments || [];

        // Merge without duplicates
        setComments((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newOnes = freshComments.filter((c) => !existingIds.has(c._id));

          if (newOnes.length > 0) {
            console.log(`📥 Polling: Found ${newOnes.length} new comments`);
            return [...newOnes, ...prev];
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to refetch comments:", err);
      }
    };

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetchComments();
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, [messageId]);

  const rootComments = comments.filter((c) => !c.parentComment);

  return (
    <div className="commentpage">
      <div className="mx-auto" style={{ width: "100%", marginLeft: "5vw" }}>
        <button
          onClick={() => navigate(-1)}
          className="flex mb-3 items-center gap-2 text-gray-700 hover:text-primary transition"
        >
          <ChevronLeft size={20} /> Back
        </button>

        {/* MESSAGE HEADER */}
        {message && (
          <div className="rounded-xl shadow-sm mb-4 bg-white p-4">
            <div className="flex gap-4 items-center mb-3">
              <img
                src={
                  message.sender?.profilePicture?.url ||
                  message.senderDisplayProfile ||
                  "/travel.jpg"
                }
                className="size-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">
                  {message.senderDisplayName ||
                    message.sender?.username ||
                    "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {message.content && (
              <p className="text-base mb-3">{message.content}</p>
            )}

            {message.media?.url && (
              <img
                src={message.media.url}
                className="w-full rounded-xl object-cover max-h-[400px]"
                alt="Message media"
              />
            )}

            {message.type === "poll" && message.poll && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-3">{message.poll.question}</p>
                <div className="space-y-2">
                  {message.poll.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span>{opt.text}</span>
                      <span className="text-sm text-gray-500">
                        {opt.votes?.length || 0} votes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMMENT INPUT */}
        <CommentInput
          messageId={messageId}
          userProfile={userProfile}
          onNewComment={(c) => setComments((p) => [c, ...p])}
        />

        {/* COMMENTS LIST */}
        <div className="p-4 bg-white rounded-xl shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-gray-800">Comments</h3>

          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Be the first to comment ✨
            </p>
          ) : (
            rootComments.map((c) => (
              <CommentItem
                key={c._id}
                comment={c}
                allComments={comments}
                messageAuthorId={message?.sender?._id}
                userId={userProfile?._id}
                timeAgo={timeAgo}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

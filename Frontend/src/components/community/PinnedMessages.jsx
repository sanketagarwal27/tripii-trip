import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { togglePinMessage, voteOnPoll } from "@/api/community";
import Linkify from "linkify-react";
import { setSelectedMessage } from "@/redux/communitySlice";

const PinnedMessages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const communityProfile = useSelector((s) => s.community.profile);
  const messages = useSelector((s) => s.community.messages || []);

  const [expandedMessage, setExpandedMessage] = useState(null);

  // Get pinned messages with full data
  const pinnedMessages = useMemo(() => {
    if (!Array.isArray(communityProfile?.pinnedMessages)) return [];

    const pinned = communityProfile.pinnedMessages
      .map((p) => {
        // Handle different formats
        if (typeof p === "object" && p.message) {
          // Check if message is already populated
          if (typeof p.message === "object" && p.message._id) {
            return {
              ...p.message,
              pinnedAt: p.pinnedAt,
              pinnedBy: p.pinnedBy,
            };
          }

          // Message is just an ID, try to find it in Redux messages
          const messageId = p.message;
          const foundMessage = messages.find(
            (m) => String(m._id) === String(messageId)
          );

          if (foundMessage) {
            return {
              ...foundMessage,
              pinnedAt: p.pinnedAt,
              pinnedBy: p.pinnedBy,
            };
          }

          // Message not in Redux yet, return partial data
          return {
            _id: messageId,
            pinnedAt: p.pinnedAt,
            pinnedBy: p.pinnedBy,
            isPartial: true,
          };
        }

        return null;
      })
      .filter(Boolean);

    // Sort by pinnedAt descending (most recent first)
    return pinned.sort(
      (a, b) => new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0)
    );
  }, [communityProfile?.pinnedMessages, messages]);

  console.log("pop:", pinnedMessages);

  // Check permissions
  const isModerator = communityProfile?.moderators?.some(
    (mod) => mod === user?._id || mod?._id === user?._id
  );
  const isAdmin = communityProfile?.createdBy?._id === user?._id;
  const canUnpin = isModerator || isAdmin;

  const handleUnpin = async (messageId) => {
    if (!window.confirm("Unpin this message?")) return;

    try {
      await togglePinMessage(messageId);
    } catch (err) {
      console.error("Unpin error:", err);
    }
  };

  const handleCommentClick = (message) => {
    dispatch(setSelectedMessage(message));
    navigate(`/community/${message.community}/message/${message._id}/comments`);
  };

  if (!pinnedMessages.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-text-muted-light mb-4">
            push_pin
          </span>
          <h3 className="text-xl font-semibold text-text-light mb-2">
            No Pinned Messages
          </h3>
          <p className="text-text-muted-light">
            Important messages will appear here when pinned by moderators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary">push_pin</span>
        <h2 className="text-2xl font-bold text-text-light">Pinned Messages</h2>
        <span className="text-sm text-text-muted-light">
          ({pinnedMessages.length})
        </span>
      </div>

      <div className="space-y-3">
        {pinnedMessages.map((msg) => {
          const isExpanded = expandedMessage === msg._id;
          const avatar =
            msg.sender?.profilePicture?.url ||
            msg.senderDisplayProfile ||
            "/public/travel.jpg";
          const username =
            msg.sender?.username || msg.senderDisplayName || "Unknown";

          // Handle partial messages (not yet in Redux)
          if (msg.isPartial) {
            return (
              <div
                key={msg._id}
                className="rounded-xl p-4 bg-[rgb(250,250,250)] dark:bg-surface-dark border-l-4 border-primary"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      push_pin
                    </span>
                    <span className="text-sm text-text-muted-light">
                      Loading message...
                    </span>
                  </div>
                  {canUnpin && (
                    <button
                      onClick={() => handleUnpin(msg._id)}
                      className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                      Unpin
                    </button>
                  )}
                </div>
              </div>
            );
          }

          const contentPreview =
            msg.content && msg.content.length > 150
              ? msg.content.substring(0, 150) + "..."
              : msg.content;

          return (
            <PinnedMessageCard
              key={msg._id}
              msg={msg}
              user={user}
              canUnpin={canUnpin}
              isExpanded={isExpanded}
              contentPreview={contentPreview}
              avatar={avatar}
              username={username}
              onUnpin={handleUnpin}
              onCommentClick={handleCommentClick}
              onToggleExpand={() =>
                setExpandedMessage(isExpanded ? null : msg._id)
              }
            />
          );
        })}
      </div>
    </div>
  );
};

// Separate component for each pinned message to manage its own poll state
const PinnedMessageCard = ({
  msg,
  user,
  canUnpin,
  isExpanded,
  contentPreview,
  avatar,
  username,
  onUnpin,
  onCommentClick,
  onToggleExpand,
}) => {
  // Get the latest message data from Redux store
  const messages = useSelector((s) => s.community.messages || []);

  // Merge latest data from Redux with pinning metadata from msg
  const latestMsg = useMemo(() => {
    const found = messages.find((m) => String(m._id) === String(msg._id));
    if (found) {
      // Use latest data but preserve pinning metadata
      return {
        ...found,
        pinnedAt: msg.pinnedAt,
        pinnedBy: msg.pinnedBy,
      };
    }
    return msg;
  }, [messages, msg]);
  console.log("lat:", latestMsg);

  // Poll state for THIS specific message
  const [selectedPollOptions, setSelectedPollOptions] = useState([]);
  const [isChangingVote, setIsChangingVote] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate poll-related values for THIS message using LATEST data
  const hasVoted = useMemo(() => {
    if (!latestMsg.poll?.options || !user?._id) return false;
    return latestMsg.poll.options.some((opt) =>
      opt.votes?.some((v) => String(v) === String(user._id))
    );
  }, [latestMsg.poll, user?._id]);

  const myVotes = useMemo(() => {
    if (!latestMsg.poll?.options || !user?._id) return new Set();
    const voted = new Set();
    latestMsg.poll.options.forEach((opt) => {
      if (opt.votes?.some((v) => String(v) === String(user._id))) {
        voted.add(opt.id);
      }
    });
    return voted;
  }, [latestMsg.poll, user?._id]);

  const isPollExpired = useMemo(() => {
    if (!latestMsg.poll?.expiresAt) return false;
    return new Date() > new Date(latestMsg.poll.expiresAt);
  }, [latestMsg.poll?.expiresAt]);

  // Reset state when vote changes in Redux
  useEffect(() => {
    if (!isChangingVote && selectedPollOptions.length > 0) {
      setSelectedPollOptions([]);
    }
  }, [hasVoted, myVotes]);

  const togglePollOption = (optionId) => {
    if (isPollExpired || (hasVoted && !isChangingVote)) return;

    if (latestMsg.poll.allowMultipleVotes) {
      setSelectedPollOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedPollOptions([optionId]);
    }
  };

  const handlePollVote = async () => {
    if (!selectedPollOptions.length) return;

    try {
      setLoading(true);
      const response = await voteOnPoll(latestMsg._id, selectedPollOptions);

      // Success - reset state
      setSelectedPollOptions([]);
      setIsChangingVote(false);

      // Force a small delay to allow Redux to update
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (err) {
      console.error("Poll vote error:", err);
      alert("Failed to submit vote. Please try again.");
      setLoading(false);
    }
  };

  const handleChangeVote = () => {
    setIsChangingVote(true);
    setSelectedPollOptions(Array.from(myVotes));
  };

  const handleCancelChange = () => {
    setIsChangingVote(false);
    setSelectedPollOptions([]);
  };

  return (
    <div className="rounded-xl p-4 bg-[rgb(250,250,250)] dark:bg-surface-dark border-l-4 border-primary hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url(${avatar})` }}
          />
          <div className="flex flex-col">
            <span className="font-bold text-text-light">{username}</span>
            <span className="text-xs text-text-muted-light">
              Pinned {new Date(latestMsg.pinnedAt).toLocaleDateString()} at{" "}
              {new Date(latestMsg.pinnedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              by{" "}
              {latestMsg.pinnedBy?.username || latestMsg.pinnedBy || "Unknown"}
            </span>
          </div>
        </div>

        {canUnpin && (
          <button
            onClick={() => onUnpin(latestMsg._id)}
            className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[16px]">
              push_pin
            </span>
            Unpin
          </button>
        )}
      </div>

      {/* Content */}
      {latestMsg.content && (
        <div className="mb-3">
          <p className="text-[15px] leading-relaxed text-text-light">
            <Linkify
              options={{
                target: "_blank",
                rel: "noopener noreferrer",
                className: "chat-link",
              }}
            >
              {isExpanded ? latestMsg.content : contentPreview}
            </Linkify>
          </p>
          {latestMsg.content.length > 150 && (
            <button
              onClick={onToggleExpand}
              className="text-xs text-primary hover:underline mt-1"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Poll */}
      {latestMsg.type === "poll" && latestMsg.poll && (
        <div className="mb-3 p-4 bg-white dark:bg-surface-darker rounded-lg border">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-lg">{latestMsg.poll.question}</h4>
            {isPollExpired && (
              <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                Expired
              </span>
            )}
          </div>

          <div className="space-y-2">
            {latestMsg.poll.options.map((option) => {
              const voteCount = option.votes?.length || 0;
              const percentage =
                latestMsg.poll.totalVotes > 0
                  ? Math.round((voteCount / latestMsg.poll.totalVotes) * 100)
                  : 0;

              const isVoted = myVotes.has(option.id);
              const isSelected = selectedPollOptions.includes(option.id);

              return (
                <button
                  key={option.id}
                  onClick={() => togglePollOption(option.id)}
                  disabled={
                    isPollExpired || (hasVoted && !isChangingVote) || loading
                  }
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    isVoted
                      ? "border-primary bg-primary/10"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border-light hover:border-primary/50"
                  } ${
                    isPollExpired || (hasVoted && !isChangingVote) || loading
                      ? "cursor-not-allowed opacity-75"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{option.text}</span>
                    {(hasVoted || isChangingVote) && (
                      <span className="text-sm font-bold">{percentage}%</span>
                    )}
                  </div>

                  {(hasVoted || isChangingVote) && (
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-text-muted-light">
                      {voteCount} {voteCount === 1 ? "vote" : "votes"}
                    </span>
                    {isVoted && !isChangingVote && (
                      <span className="text-xs text-primary font-medium">
                        ✓ Your vote
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Poll Actions */}
          {!hasVoted && !isPollExpired && selectedPollOptions.length > 0 && (
            <button
              onClick={handlePollVote}
              disabled={loading}
              className="mt-3 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? "Voting..." : "Submit Vote"}
            </button>
          )}

          {hasVoted && !isPollExpired && !isChangingVote && (
            <button
              onClick={handleChangeVote}
              disabled={loading}
              className="mt-3 w-full border border-primary text-primary py-2 rounded-lg font-semibold hover:bg-primary/5 transition disabled:opacity-50"
            >
              Change Vote
            </button>
          )}

          {hasVoted && !isPollExpired && isChangingVote && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCancelChange}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePollVote}
                disabled={loading || selectedPollOptions.length === 0}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {loading ? "Updating..." : "Update Vote"}
              </button>
            </div>
          )}

          <div className="mt-3 text-xs text-text-muted-light">
            {latestMsg.poll.totalVotes}{" "}
            {latestMsg.poll.totalVotes === 1 ? "vote" : "votes"} •{" "}
            {latestMsg.poll.allowMultipleVotes
              ? "Multiple votes allowed"
              : "Single vote only"}
            {latestMsg.poll.expiresAt && (
              <>
                {" "}
                • Expires{" "}
                {new Date(latestMsg.poll.expiresAt).toLocaleDateString()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      {latestMsg.media?.url && latestMsg.type === "image" && (
        <div className="mb-3 rounded-lg overflow-hidden border border-border-light max-w-md">
          <img
            src={latestMsg.media.url}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* GIF */}
      {latestMsg.media?.url && latestMsg.type === "gif" && (
        <div className="mb-3 rounded-lg overflow-hidden border border-border-light max-w-md">
          <img
            src={latestMsg.media.url}
            alt="GIF"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border-light">
        <button
          onClick={() => onCommentClick(latestMsg)}
          className="flex items-center gap-1 text-xs text-text-muted-light hover:text-primary transition"
        >
          <span className="material-symbols-outlined !text-[18px]">
            mode_comment
          </span>
          <span>{latestMsg.commentCount || 0} Comments</span>
        </button>

        <div className="flex items-center gap-1 text-xs text-text-muted-light">
          <span className="material-symbols-outlined !text-[18px]">
            expand_less
          </span>
          <span>{latestMsg.helpfulCount || 0} Helpful</span>
        </div>

        <span className="text-xs text-text-muted-light ml-auto">
          Posted {new Date(latestMsg.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default PinnedMessages;

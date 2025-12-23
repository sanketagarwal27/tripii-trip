import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  reactOnMessage,
  messageHelpful,
  voteOnPoll,
  deleteMessage,
  togglePinMessage,
  reportMessage,
} from "@/api/community";
import EmojiPickerPopover from "@/components/common/EmojiPickerPopover";
import { aggregateReactions } from "@/utils/aggregateReactions";
import { useNavigate } from "react-router-dom";
import { setSelectedMessage } from "@/redux/communitySlice";
import Linkify from "linkify-react";

const CommunityPost = ({ post }) => {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* ---------------------------
     🔥 GET LATEST POST DATA FROM REDUX
  ---------------------------- */
  const messages = useSelector((s) => s.community.messages || []);
  const selectedCommunity = useSelector((s) => s.community.profile);

  const latestPost = useMemo(() => {
    return messages.find((m) => m._id === post._id) || post;
  }, [messages, post, post._id]);

  /* ---------------------------
     LOCAL STATE (OPTIMISTIC UI ONLY)
  ---------------------------- */
  const [isHelpful, setIsHelpful] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPollOptions, setSelectedPollOptions] = useState([]);
  const [isChangingVote, setIsChangingVote] = useState(false);

  const menuRef = useRef(null);

  /* ---------------------------
     SYNC HELPFUL STATE
  ---------------------------- */
  useEffect(() => {
    const helpful = latestPost.helpful?.some((h) => h.user === user?._id);
    setIsHelpful(Boolean(helpful));
  }, [latestPost.helpful, user?._id]);

  /* ---------------------------
     CLOSE MENU ON OUTSIDE CLICK
  ---------------------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  /* ---------------------------
     DERIVED STATE
  ---------------------------- */
  const helpfulCount = latestPost.helpfulCount ?? 0;

  // 🔥 FIXED: Check pinnedMessages array correctly
  const isPinned = useMemo(() => {
    if (!Array.isArray(selectedCommunity?.pinnedMessages)) return false;

    return selectedCommunity.pinnedMessages.some((p) => {
      // Handle both object with message property and direct string ID
      const pinnedMessageId =
        typeof p === "object" && p.message ? p.message : p;
      const currentMessageId =
        typeof pinnedMessageId === "object" && pinnedMessageId._id
          ? pinnedMessageId._id
          : pinnedMessageId;

      return String(currentMessageId) === String(latestPost._id);
    });
  }, [selectedCommunity?.pinnedMessages, latestPost._id]);

  /* ---------------------------
     PERMISSIONS
  ---------------------------- */
  const isOwner = latestPost.sender?._id === user?._id;

  const isModerator = selectedCommunity?.moderators?.some(
    (mod) => mod === user?._id || mod?._id === user?._id
  );

  const isAdmin = selectedCommunity?.createdBy?._id === user?._id;

  const canDelete = isOwner || isModerator || isAdmin;
  const canPin = isModerator || isAdmin;

  /* ---------------------------
     REACTIONS
  ---------------------------- */
  const myReactions = useMemo(() => {
    if (!Array.isArray(latestPost.reactions) || !user?._id) return new Set();

    return new Set(
      latestPost.reactions.filter((r) => r.by === user._id).map((r) => r.emoji)
    );
  }, [latestPost.reactions, user?._id]);

  const aggregatedReactions = useMemo(() => {
    return aggregateReactions(latestPost.reactions);
  }, [latestPost.reactions]);

  /* ---------------------------
     🔥 POLL LOGIC
  ---------------------------- */
  const hasVoted = useMemo(() => {
    if (!latestPost.poll?.options || !user?._id) return false;

    return latestPost.poll.options.some((opt) =>
      opt.votes?.some((v) => v.toString() === user._id.toString())
    );
  }, [latestPost.poll, user?._id]);

  const myVotes = useMemo(() => {
    if (!latestPost.poll?.options || !user?._id) return new Set();

    const voted = new Set();
    latestPost.poll.options.forEach((opt) => {
      if (opt.votes?.some((v) => v.toString() === user._id.toString())) {
        voted.add(opt.id);
      }
    });
    return voted;
  }, [latestPost.poll, user?._id]);

  const isPollExpired = useMemo(() => {
    if (!latestPost.poll?.expiresAt) return false;
    return new Date() > new Date(latestPost.poll.expiresAt);
  }, [latestPost.poll?.expiresAt]);

  const togglePollOption = (optionId) => {
    if (isPollExpired || (hasVoted && !isChangingVote)) return;

    if (latestPost.poll.allowMultipleVotes) {
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
      await voteOnPoll(latestPost._id, selectedPollOptions);
      setSelectedPollOptions([]);
      setIsChangingVote(false);
    } catch (err) {
      console.error("Poll vote error:", err);
    } finally {
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

  /* ---------------------------
     HELPFUL
  ---------------------------- */
  const toggleHelpful = async () => {
    if (loading) return;

    const next = !isHelpful;
    setIsHelpful(next);
    setLoading(true);

    try {
      await messageHelpful(latestPost._id);
    } catch (err) {
      setIsHelpful(!next);
      console.error("Helpful error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     EMOJI REACTION
  ---------------------------- */
  const handleEmojiReact = async (emoji) => {
    try {
      await reactOnMessage(latestPost._id, emoji);
      setShowPicker(false);
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  /* ---------------------------
     MENU ACTIONS
  ---------------------------- */
  const handleDelete = async () => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await deleteMessage(latestPost._id);
      setShowMenu(false);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handlePin = async () => {
    try {
      setLoading(true);
      await togglePinMessage(latestPost._id);
      setShowMenu(false);
    } catch (err) {
      console.error("Pin error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Reason for reporting?");
    if (!reason) return;

    try {
      await reportMessage(latestPost._id, reason);
      setShowMenu(false);
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  const avatar = latestPost.sender?.profilePicture?.url || "/public/travel.jpg";

  return (
    <div className="group relative rounded-xl p-4 bg-[rgb(250,250,250)] dark:bg-surface-dark">
      {isPinned && (
        <div className="absolute -top-2 left-4 bg-primary text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">
            push_pin
          </span>
          Pinned
        </div>
      )}

      <div className="flex gap-3">
        {/* ---------------- HELPFUL ---------------- */}
        <div className="flex flex-col items-center gap-1 w-8 shrink-0 pt-1">
          <button
            onClick={toggleHelpful}
            disabled={loading}
            className={`rounded p-0.5 transition ${
              isHelpful
                ? "text-green-500 bg-green-500/10"
                : "text-text-muted-light hover:text-primary hover:bg-primary/10"
            }`}
          >
            <span className="material-symbols-outlined">expand_less</span>
          </button>

          <span className="text-sm font-bold">{helpfulCount}</span>
        </div>

        {/* ---------------- CONTENT ---------------- */}
        <div className="flex-1 min-w-0">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-muted-light">
              <div
                className="w-8 h-8 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatar})` }}
              />
              <span className="font-bold text-[16px] text-text-light">
                {latestPost.sender?.username ||
                  latestPost.senderDisplayName ||
                  "Unknown"}
              </span>
              <span>•</span>
              <span>{new Date(latestPost.createdAt).toLocaleString()}</span>
            </div>

            {/* 🔥 3-DOT MENU */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-background-light rounded-full transition"
              >
                <span className="material-symbols-outlined text-text-muted-light">
                  more_vert
                </span>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-white dark:bg-surface-darker border border-border-light rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-light flex items-center gap-2 text-red-500"
                    >
                      <span className="material-symbols-outlined !text-[18px]">
                        delete
                      </span>
                      Delete
                    </button>
                  )}

                  {canPin && (
                    <button
                      onClick={handlePin}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-light flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-[18px]">
                        {isPinned ? "push_pin" : "keep"}
                      </span>
                      {isPinned ? "Unpin" : "Pin Message"}
                    </button>
                  )}

                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-background-light flex items-center gap-2 text-orange-500"
                  >
                    <span className="material-symbols-outlined !text-[18px]">
                      flag
                    </span>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TEXT */}
          {latestPost.content && (
            <p className="text-[16px] leading-relaxed text-text-light mt-2">
              <Linkify
                options={{
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "chat-link",
                }}
              >
                {latestPost.content}
              </Linkify>
            </p>
          )}

          {/* POLL */}
          {latestPost.type === "poll" && latestPost.poll && (
            <div className="mt-3 p-4 bg-white dark:bg-surface-darker rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-lg">
                  {latestPost.poll.question}
                </h4>
                {isPollExpired && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                    Expired
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {latestPost.poll.options.map((option) => {
                  const voteCount = option.votes?.length || 0;
                  const percentage =
                    latestPost.poll.totalVotes > 0
                      ? Math.round(
                          (voteCount / latestPost.poll.totalVotes) * 100
                        )
                      : 0;
                  const isVoted = myVotes.has(option.id);
                  const isSelected = selectedPollOptions.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={() => togglePollOption(option.id)}
                      disabled={isPollExpired || (hasVoted && !isChangingVote)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        isVoted
                          ? "border-primary bg-primary/10"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border-light hover:border-primary/50"
                      } ${
                        isPollExpired || (hasVoted && !isChangingVote)
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{option.text}</span>
                        {(hasVoted || isChangingVote) && (
                          <span className="text-sm font-bold">
                            {percentage}%
                          </span>
                        )}
                      </div>

                      {(hasVoted || isChangingVote) && (
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
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

              {/* POLL ACTIONS */}
              {!hasVoted &&
                !isPollExpired &&
                selectedPollOptions.length > 0 && (
                  <button
                    onClick={handlePollVote}
                    disabled={loading}
                    className="mt-3 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "Voting..." : "Submit Vote"}
                  </button>
                )}

              {hasVoted && !isPollExpired && !isChangingVote && (
                <button
                  onClick={handleChangeVote}
                  className="mt-3 w-full border border-primary text-primary py-2 rounded-lg font-semibold hover:bg-primary/5"
                >
                  Change Vote
                </button>
              )}

              {hasVoted && !isPollExpired && isChangingVote && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCancelChange}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePollVote}
                    disabled={loading || selectedPollOptions.length === 0}
                    className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Vote"}
                  </button>
                </div>
              )}

              <div className="mt-3 text-xs text-text-muted-light">
                {latestPost.poll.totalVotes}{" "}
                {latestPost.poll.totalVotes === 1 ? "vote" : "votes"} •{" "}
                {latestPost.poll.allowMultipleVotes
                  ? "Multiple votes allowed"
                  : "Single vote only"}
                {latestPost.poll.expiresAt && (
                  <>
                    {" "}
                    • Expires{" "}
                    {new Date(latestPost.poll.expiresAt).toLocaleDateString()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* IMAGE */}
          {latestPost.media?.url && latestPost.type === "image" && (
            <div className="mt-3 max-w-full rounded-lg overflow-hidden border border-border-light">
              <img
                src={latestPost.media.url}
                alt=""
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* GIF */}
          {latestPost.media?.url && latestPost.type === "gif" && (
            <div className="mt-3 max-w-full rounded-lg overflow-hidden border border-border-light">
              <img
                src={latestPost.media.url}
                alt="GIF"
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* ACTION BAR */}
          <div className="flex items-center gap-3 mt-3">
            {/* REACT BUTTON */}
            <div className="relative">
              <button
                onClick={() => setShowPicker((s) => !s)}
                className="flex items-center gap-1 px-2 py-1 bg-background-light rounded-full text-xs hover:bg-primary/10"
              >
                <span className="material-symbols-outlined !text-[18px]">
                  add_reaction
                </span>
                React
              </button>

              {showPicker && (
                <EmojiPickerPopover
                  onSelect={handleEmojiReact}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </div>

            {/* COMMENT ICON */}
            <div className="flex items-center gap-1 text-xs text-text-muted-light cursor-pointer hover:text-primary">
              <span
                className="material-symbols-outlined !text-[18px]"
                onClick={() => {
                  dispatch(setSelectedMessage(latestPost));
                  navigate(
                    `/community/${latestPost.community}/message/${latestPost._id}/comments`
                  );
                }}
              >
                mode_comment
              </span>
              <span className="font-bold">{latestPost.commentCount || 0}</span>
            </div>

            {/* REACTIONS DISPLAY */}
            {aggregatedReactions.length > 0 && (
              <div className="flex gap-2 flex-1 overflow-x-auto reaction-scrollbar">
                {aggregatedReactions.map((r) => {
                  const isMine = myReactions.has(r.emoji);

                  return (
                    <button
                      key={r.emoji}
                      onClick={() => handleEmojiReact(r.emoji)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs shrink-0 transition
                        ${
                          isMine
                            ? "bg-primary/20 border border-primary text-primary"
                            : "bg-background-light hover:bg-primary/10 border border-transparent"
                        }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="font-bold">{r.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPost;

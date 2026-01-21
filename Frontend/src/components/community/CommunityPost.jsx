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
  const isHelpful = useMemo(() => {
    if (!user?._id || !Array.isArray(latestPost.helpful)) return false;

    return latestPost.helpful.some((h) =>
      typeof h === "string"
        ? h === user._id
        : h?.user?.toString() === user._id.toString(),
    );
  }, [latestPost.helpful, user?._id]);

  const helpfulCount = latestPost.helpfulCount ?? 0;

  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [helpfulLoading, setHelpfulLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const [selectedPollOptions, setSelectedPollOptions] = useState([]);
  const [isChangingVote, setIsChangingVote] = useState(false);
  const [optimisticHelpful, setOptimisticHelpful] = useState(isHelpful);
  const [optimisticHelpfulCount, setOptimisticHelpfulCount] =
    useState(helpfulCount);
  const [optimisticReactions, setOptimisticReactions] = useState(
    latestPost.reactions || [],
  );
  const [optimisticHasVoted, setOptimisticHasVoted] = useState(
    () =>
      latestPost.poll?.options?.some((opt) => opt.votes?.includes(user?._id)) ??
      false,
  );

  const [optimisticPoll, setOptimisticPoll] = useState(latestPost.poll || null);

  const menuRef = useRef(null);

  /* ---------------------------
     SYNC STATE
  ---------------------------- */

  useEffect(() => {
    setOptimisticHelpful(isHelpful);
    setOptimisticHelpfulCount(helpfulCount);
  }, [isHelpful, helpfulCount]);

  useEffect(() => {
    setOptimisticReactions(latestPost.reactions || []);
  }, [latestPost.reactions]);

  useEffect(() => {
    setOptimisticPoll(latestPost.poll || null);
  }, [latestPost.poll]);

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

  const isModerator = selectedCommunity?.currentUserRole === "moderator";

  const isAdmin = selectedCommunity?.currentUserRole === "admin";

  const canDelete = isOwner || isModerator || isAdmin;
  const canPin = isModerator || isAdmin;

  /* ---------------------------
     REACTIONS
  ---------------------------- */
  const myReactions = useMemo(() => {
    if (!Array.isArray(optimisticReactions) || !user?._id) return new Set();

    return new Set(
      optimisticReactions.filter((r) => r.by === user._id).map((r) => r.emoji),
    );
  }, [optimisticReactions, user?._id]);

  const aggregatedReactions = useMemo(() => {
    return aggregateReactions(optimisticReactions);
  }, [optimisticReactions]);

  /* ---------------------------
     🔥 POLL LOGIC
  ---------------------------- */

  const myVotes = useMemo(() => {
    if (!optimisticPoll?.options || !user?._id) return new Set();

    const voted = new Set();
    optimisticPoll.options.forEach((opt) => {
      if (opt.votes?.includes(user._id)) {
        voted.add(opt.id);
      }
    });
    return voted;
  }, [optimisticPoll, user?._id]);

  const isPollExpired = useMemo(() => {
    if (!optimisticPoll?.expiresAt) return false;
    return new Date() > new Date(optimisticPoll.expiresAt);
  }, [optimisticPoll?.expiresAt]);

  const togglePollOption = (optionId) => {
    if (!optimisticPoll) return;
    if (isPollExpired || (optimisticHasVoted && !isChangingVote)) return;

    if (optimisticPoll.allowMultipleVotes) {
      setSelectedPollOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelectedPollOptions([optionId]);
    }
  };

  const handlePollVote = async () => {
    if (!optimisticPoll || pollLoading || !selectedPollOptions.length) return;

    setPollLoading(true);

    // ---------- SNAPSHOT FOR ROLLBACK ----------
    const prevPoll = structuredClone(optimisticPoll);

    // ---------- OPTIMISTIC UPDATE ----------
    const nextPoll = { ...optimisticPoll };

    // remove user from all options (important for change vote)
    nextPoll.options = nextPoll.options.map((opt) => ({
      ...opt,
      votes: opt.votes.filter((v) => v !== user._id),
    }));

    // add user to selected options
    nextPoll.options = nextPoll.options.map((opt) =>
      selectedPollOptions.includes(opt.id)
        ? { ...opt, votes: [...opt.votes, user._id] }
        : opt,
    );

    // recalc totalVotes
    nextPoll.totalVotes = nextPoll.options.reduce(
      (sum, opt) => sum + opt.votes.length,
      0,
    );

    // commit optimistic state
    setOptimisticPoll(nextPoll);
    setOptimisticHasVoted(true);
    setSelectedPollOptions([]);
    setIsChangingVote(false);

    try {
      await voteOnPoll(latestPost._id, selectedPollOptions);
    } catch (err) {
      console.error("Poll vote error:", err);
      // ---------- ROLLBACK ----------
      setOptimisticPoll(prevPoll);
      setOptimisticHasVoted(false);
    } finally {
      setPollLoading(false);
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
    if (helpfulLoading) return;

    const nextState = !optimisticHelpful;

    // 🔥 instant UI update
    setOptimisticHelpful(nextState);
    setOptimisticHelpfulCount((c) => c + (nextState ? 1 : -1));

    setHelpfulLoading(true);
    try {
      await messageHelpful(latestPost._id);
    } catch (err) {
      // ❌ rollback if backend fails
      setOptimisticHelpful(!nextState);
      setOptimisticHelpfulCount((c) => c - (nextState ? 1 : -1));
      console.error("Helpful error:", err);
    } finally {
      setHelpfulLoading(false);
    }
  };

  /* ---------------------------
     EMOJI REACTION
  ---------------------------- */
  const handleEmojiReact = async (emoji) => {
    if (!user?._id || reactionLoading) return;

    const alreadyReacted = optimisticReactions.some(
      (r) => r.by === user._id && r.emoji === emoji,
    );

    // optimistic update
    setOptimisticReactions((prev) =>
      alreadyReacted
        ? prev.filter((r) => !(r.by === user._id && r.emoji === emoji))
        : [...prev, { emoji, by: user._id }],
    );

    setReactionLoading(true);

    try {
      await reactOnMessage(latestPost._id, emoji);
      setShowPicker(false);
    } catch (err) {
      console.error("Reaction error:", err);
      // rollback by resyncing
      setOptimisticReactions(
        messages.find((m) => m._id === latestPost._id)?.reactions || [],
      );
    } finally {
      setReactionLoading(false);
    }
  };

  /* ---------------------------
     MENU ACTIONS
  ---------------------------- */
  const handleDelete = async () => {
    if (!window.confirm("Delete this message?") || pinLoading) return;

    setPinLoading(true);
    setShowMenu(false);

    try {
      await deleteMessage(latestPost._id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setPinLoading(false);
    }
  };

  const handlePin = async () => {
    if (pinLoading) return;

    setPinLoading(true);
    setShowMenu(false);

    try {
      await togglePinMessage(latestPost._id);
    } catch (err) {
      console.error("Pin error:", err);
    } finally {
      setPinLoading(false);
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

  const avatar =
    latestPost?.sender?.profilePicture?.url || "/public/travel.jpg";

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
            disabled={helpfulLoading}
            className={`rounded p-0.5 transition ${
              optimisticHelpful
                ? "text-green-500 bg-green-500/10"
                : "text-text-muted-light hover:text-primary hover:bg-primary/10"
            } ${helpfulLoading ? "opacity-50 cursor-not-allowed" : ""}
}`}
          >
            <span className="material-symbols-outlined">expand_less</span>
          </button>

          <span className="text-sm font-bold">{optimisticHelpfulCount}</span>
        </div>

        {/* ---------------- CONTENT ---------------- */}
        <div className="flex-1 min-w-0">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-muted-light">
              <div
                className="w-8 h-8 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatar})`, cursor: "pointer" }}
                onClick={() => navigate(`/profile/${latestPost?.sender?._id}`)}
              />
              <span
                className="font-bold text-[16px] text-text-light"
                onClick={() => navigate(`/profile/${latestPost?.sender?._id}`)}
                style={{ cursor: "pointer" }}
              >
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
          {latestPost.type === "poll" && optimisticPoll && (
            <div className="mt-3 p-4 bg-white dark:bg-surface-darker rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-lg">
                  {optimisticPoll.question}
                </h4>
                {isPollExpired && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                    Expired
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {optimisticPoll.options.map((option) => {
                  const voteCount = option.votes?.length || 0;
                  const percentage =
                    optimisticPoll.totalVotes > 0
                      ? Math.round(
                          (voteCount / optimisticPoll.totalVotes) * 100,
                        )
                      : 0;
                  const isVoted = myVotes.has(option.id);
                  const isSelected = selectedPollOptions.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={() => togglePollOption(option.id)}
                      disabled={
                        isPollExpired || (optimisticHasVoted && !isChangingVote)
                      }
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        isVoted
                          ? "border-primary bg-primary/10"
                          : isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border-light hover:border-primary/50"
                      } ${
                        isPollExpired || (optimisticHasVoted && !isChangingVote)
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{option.text}</span>
                        {(optimisticHasVoted || isChangingVote) && (
                          <span className="text-sm font-bold">
                            {percentage}%
                          </span>
                        )}
                      </div>

                      {(optimisticHasVoted || isChangingVote) && (
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
              {!optimisticHasVoted &&
                !isPollExpired &&
                selectedPollOptions.length > 0 && (
                  <button
                    onClick={handlePollVote}
                    disabled={pollLoading}
                    className="mt-3 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {pollLoading ? "Voting..." : "Submit Vote"}
                  </button>
                )}

              {optimisticHasVoted && !isPollExpired && !isChangingVote && (
                <button
                  onClick={handleChangeVote}
                  className="mt-3 w-full border border-primary text-primary py-2 rounded-lg font-semibold hover:bg-primary/5"
                >
                  Change Vote
                </button>
              )}

              {optimisticHasVoted && !isPollExpired && isChangingVote && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCancelChange}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePollVote}
                    disabled={pollLoading || selectedPollOptions.length === 0}
                    className={`flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 ${
                      pollLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {pollLoading ? "Updating..." : "Update Vote"}
                  </button>
                </div>
              )}

              <div className="mt-3 text-xs text-text-muted-light">
                {optimisticPoll.totalVotes}{" "}
                {optimisticPoll.totalVotes === 1 ? "vote" : "votes"} •{" "}
                {optimisticPoll.allowMultipleVotes
                  ? "Multiple votes allowed"
                  : "Single vote only"}
                {optimisticPoll.expiresAt && (
                  <>
                    {" "}
                    • Expires{" "}
                    {new Date(optimisticPoll.expiresAt).toLocaleDateString()}
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
                disabled={reactionLoading}
                onClick={() => setShowPicker((s) => !s)}
                className={`flex items-center gap-1 px-2 py-1 bg-background-light rounded-full text-xs
    ${
      reactionLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10"
    }`}
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
            <div
              className="flex items-center gap-1 text-xs text-text-muted-light cursor-pointer hover:text-primary"
              onClick={() => {
                dispatch(setSelectedMessage(latestPost));
                navigate(
                  `/community/${latestPost.community}/message/${latestPost._id}/comments`,
                );
              }}
            >
              <span className="material-symbols-outlined !text-[18px]">
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
                      onClick={
                        !reactionLoading
                          ? () => handleEmojiReact(r.emoji)
                          : undefined
                      }
                      disabled={reactionLoading}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs shrink-0 transition
    ${
      isMine
        ? "bg-primary/20 border border-primary text-primary"
        : "bg-background-light hover:bg-primary/10 border border-transparent"
    }
    ${reactionLoading ? "opacity-50 cursor-not-allowed" : ""}
  `}
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

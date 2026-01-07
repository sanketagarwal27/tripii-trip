import styles from "./ChatInterface.module.css";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { SUNDAY_ICONS } from "./SundayIcons";
import { chatbotEditMessage } from "@/redux/chatbotSlice";
import { Clock, MapPin, Plus, Trash2 } from "lucide-react";
import ApplyToTripOverlay from "@/components/trip/ApplyToTripOverlay";
import { addAiTripPlans } from "@/api/trip";
import { addTripPlan, hydrateTripData } from "@/redux/tripSlice";
import { useNavigate } from "react-router-dom";

/* ---------------- PLAN DETECTION ---------------- */
function tryParsePlan(text) {
  if (typeof text !== "string") return null;

  try {
    const parsed = JSON.parse(text);

    if (
      parsed &&
      Array.isArray(parsed.days) &&
      parsed.days.every(
        (d) => typeof d.day === "number" && Array.isArray(d.plans)
      )
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/* ---------------- TRIP PLAN EDITOR ---------------- */
function TripPlanEditor({ plan, editable = false, onChange }) {
  if (!plan?.days) return null;

  const clone = () => structuredClone(plan);

  const updateDaySummary = (dayIdx, value) => {
    const p = clone();
    p.days[dayIdx].summary = value;
    onChange?.(p);
  };

  const updatePlanField = (dayIdx, planIdx, field, value) => {
    const p = clone();
    p.days[dayIdx].plans[planIdx][field] = value;
    onChange?.(p);
  };

  const updatePlanTime = (dayIdx, planIdx, key, value) => {
    const p = clone();
    p.days[dayIdx].plans[planIdx].time[key] = value;
    onChange?.(p);
  };

  const removePlan = (dayIdx, planIdx) => {
    const p = clone();
    p.days[dayIdx].plans.splice(planIdx, 1);
    onChange?.(p);
  };

  const addNewPlan = (dayIdx) => {
    const p = clone();
    p.days[dayIdx].plans.push({
      title: "New Activity",
      description: "Add description here",
      time: { start: "09:00", end: "10:00" },
      location: { name: "", address: "" },
      weatherReason: "",
    });
    onChange?.(p);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.badge}>AI Travel Plan</span>
        <span className={styles.sub}>
          {editable ? "Editing plan" : "Structured & editable"}
        </span>
      </div>

      <div className={styles.days}>
        {plan.days.map((day, dIdx) => (
          <div key={dIdx} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayIndex}>Day {day.day}</div>
              {day.date && <span className={styles.dayDate}>• {day.date}</span>}
            </div>

            {editable ? (
              <input
                className={styles.daySummaryInput}
                value={day.summary || ""}
                placeholder="Day summary"
                onChange={(e) => updateDaySummary(dIdx, e.target.value)}
              />
            ) : (
              day.summary && (
                <div className={styles.daySummary}>{day.summary}</div>
              )
            )}

            <div className={styles.plans}>
              {day.plans.map((p, pIdx) => (
                <div key={pIdx} className={styles.planItem}>
                  <div className={styles.planRow}>
                    <span className={styles.bullet}>•</span>

                    <div className={styles.planContent}>
                      <div className={styles.planTitleRow}>
                        {editable ? (
                          <input
                            className={styles.planTitleInput}
                            value={p.title}
                            placeholder="Activity title"
                            onChange={(e) =>
                              updatePlanField(
                                dIdx,
                                pIdx,
                                "title",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <span className={styles.planTitle}>{p.title}</span>
                        )}

                        {editable && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => removePlan(dIdx, pIdx)}
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      <div className={styles.planMeta}>
                        <Clock size={12} />
                        {editable ? (
                          <>
                            <input
                              type="time"
                              className={styles.timeInput}
                              value={p.time.start}
                              onChange={(e) =>
                                updatePlanTime(
                                  dIdx,
                                  pIdx,
                                  "start",
                                  e.target.value
                                )
                              }
                            />
                            <span>–</span>
                            <input
                              type="time"
                              className={styles.timeInput}
                              value={p.time.end}
                              onChange={(e) =>
                                updatePlanTime(
                                  dIdx,
                                  pIdx,
                                  "end",
                                  e.target.value
                                )
                              }
                            />
                          </>
                        ) : (
                          <span>
                            {p.time.start}
                            {p.time.end ? ` – ${p.time.end}` : ""}
                          </span>
                        )}
                      </div>

                      {editable ? (
                        <textarea
                          className={styles.planDescInput}
                          rows={2}
                          value={p.description}
                          placeholder="Description"
                          onChange={(e) =>
                            updatePlanField(
                              dIdx,
                              pIdx,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p className={styles.planDesc}>{p.description}</p>
                      )}

                      {p.location?.name && (
                        <div className={styles.planLocation}>
                          <MapPin size={11} />
                          {editable ? (
                            <input
                              className={styles.locationInput}
                              value={p.location.name}
                              placeholder="Location"
                              onChange={(e) =>
                                updatePlanField(dIdx, pIdx, "location", {
                                  ...p.location,
                                  name: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span>{p.location.name}</span>
                          )}
                        </div>
                      )}

                      {p.weatherReason && !editable && (
                        <div className={styles.weatherNote}>
                          <span style={{ fontWeight: "700", color: "black" }}>
                            Weather Reason
                          </span>
                          {"->"}
                          <span> {p.weatherReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {editable && (
                <button
                  className={styles.addPlanBtn}
                  onClick={() => addNewPlan(dIdx)}
                >
                  <Plus size={14} />
                  Add activity
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {plan.budget && (
        <div className={styles.budget}>
          <div className={styles.budgetItem}>
            <span>Transport:</span>
            <strong>{plan.budget.transport}</strong>
          </div>
          <div className={styles.budgetItem}>
            <span>Stay:</span>
            <strong>{plan.budget.accommodation}</strong>
          </div>
          <div className={styles.budgetItem}>
            <span>Food:</span>
            <strong>{plan.budget.local}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- MAIN CHAT UI ---------------- */
export default function ChatInterface({ messages, isLoading }) {
  const bottomRef = useRef(null);
  const dispatch = useDispatch();
  const [showOverlay, setShowOverlay] = useState(false);
  const [planForApply, setPlanForApply] = useState(null);

  const navigate = useNavigate();

  const handleApplyPlanToTrip = async (trip) => {
    if (!planForApply?.days?.length) return;

    try {
      const res = await addAiTripPlans(trip._id, {
        days: planForApply.days,
      });

      const newPlans = res.data?.data?.plans;

      if (!Array.isArray(newPlans)) {
        throw new Error("Invalid AI plans response");
      }

      dispatch(hydrateTripData({ tripPlans: newPlans }));

      setPlanForApply(null);
      navigate(`/trips/trip/${trip._id}`);
    } catch (err) {
      console.error("Failed to apply AI plan:", err);
      alert("Failed to apply plan. Please try again.");
    }
  };

  const userProfile = useSelector((s) => s.auth.userProfile);
  const sundayIcon =
    SUNDAY_ICONS[
      ((userProfile?.username || "").length + (userProfile?.level || 1)) %
        SUNDAY_ICONS.length
    ];

  const [editingId, setEditingId] = useState(null);
  const [editablePlan, setEditablePlan] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className={styles.chatHistoryContainer}>
      {messages.map((message, index) => {
        const isUser = message.sender === "user";
        const msgId =
          message.messageId ?? message._id ?? `${message.sender}-${index}`;

        const parsedPlan =
          message.sender === "model" ? tryParsePlan(message.text) : null;

        const isEditing = editingId === msgId;

        return (
          <div
            key={msgId}
            className={`${styles.messageWrapper} ${
              isUser ? styles.userWrapper : styles.botWrapper
            }`}
          >
            {!isUser && (
              <div className={styles.sundayHeader}>
                <div className={styles.sundayIcon}>{sundayIcon}</div>
                <div className={styles.sundayName}>Sunday</div>
              </div>
            )}

            <div
              className={`${styles.messageBubble} ${
                isUser
                  ? styles.userMessage
                  : parsedPlan
                  ? styles.botMessage
                  : styles.botDiscussionMessage
              }`}
            >
              {parsedPlan ? (
                isEditing ? (
                  <>
                    <TripPlanEditor
                      plan={editablePlan}
                      editable
                      onChange={setEditablePlan}
                    />

                    <div className={styles.editActions}>
                      <button
                        className={styles.primaryBtn}
                        onClick={() => {
                          dispatch(
                            chatbotEditMessage({
                              messageId: msgId,
                              text: JSON.stringify(editablePlan),
                            })
                          );
                          setEditingId(null);
                          setEditablePlan(null);
                        }}
                      >
                        Save
                      </button>

                      <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                          setEditingId(null);
                          setEditablePlan(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.planIntro}>
                      <div className={styles.planIntroTitle}>
                        Sunday created a trip plan for you
                      </div>
                      <div className={styles.planIntroDesc}>
                        Based on your dates, budget, and preferences.
                      </div>
                    </div>

                    <TripPlanEditor plan={parsedPlan} />

                    <div className={styles.planActions}>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                          setEditingId(msgId);
                          setEditablePlan(structuredClone(parsedPlan));
                        }}
                      >
                        Edit Plan
                      </button>

                      <button
                        className={styles.primaryBtn}
                        onClick={() => {
                          setPlanForApply(editablePlan || parsedPlan);
                          setShowOverlay(true);
                        }}
                      >
                        Apply to Trip
                      </button>
                    </div>
                  </>
                )
              ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className={styles.loadingBubble}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      )}

      <div ref={bottomRef} />
      {showOverlay && (
        <ApplyToTripOverlay
          onClose={() => setShowOverlay(false)}
          onSelect={(trip) => {
            // TODO: dispatch attach-plan-to-trip
            console.log("Apply plan to:", trip._id);
            setShowOverlay(false);
            handleApplyPlanToTrip(trip);
          }}
        />
      )}
    </div>
  );
}

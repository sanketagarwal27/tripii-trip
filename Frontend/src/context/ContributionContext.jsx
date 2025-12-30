import { createContext, useContext, useEffect, useState } from "react";

const ContributionContext = createContext();

export const useContribution = () => useContext(ContributionContext);

export const ContributionProvider = ({ children }) => {
  const [tripMeta, setTripMeta] = useState({
    location: "",
    date: "",
  });

  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("currentContribution");
    if (saved) {
      const parsed = JSON.parse(saved);
      setTripMeta(parsed.meta);
      setTimeline(parsed.timeline);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "currentContribution",
      JSON.stringify({ meta: tripMeta, timeline })
    );
  }, [tripMeta, timeline]);

  //Actions
  const updateMeta = (location, date) => {
    setTripMeta({ location, date });
  };

  const addToTimeline = (data) => {
    const newData = {
      ...data,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    setTimeline((prev) => [...prev, newData]);
  };

  const updateTimeline = (id, updatedData) => {
    setTimeline((prev) =>
      prev.map((item) => (item.id === id ? { ...updatedData, id } : item))
    );
  };

  const removeFromTimeline = (id) => {
    setTimeline((prev) => prev.filter((item) => item.id !== id));
  };

  const clearSession = () => {
    setTripMeta({ location: "", date: "" });
    setTimeline([]);
    localStorage.removeItem("currentContribution");
  };

  return (
    <ContributionContext.Provider
      value={{
        tripMeta,
        timeline,
        updateMeta,
        addToTimeline,
        updateTimeline,
        removeFromTimeline,
        clearSession,
      }}
    >
      {children}
    </ContributionContext.Provider>
  );
};

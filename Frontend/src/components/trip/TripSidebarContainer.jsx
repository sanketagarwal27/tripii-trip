// TripSidebarContainer.jsx
import TripSidebar from "./TripSidebar";
import LeftSidebar from "../home/LeftSideBar";
import clsx from "clsx";
import { ArrowLeftRight } from "lucide-react";

export default function TripSidebarContainer({ mode, setMode }) {
  const toggle = () => {
    setMode((m) => (m === 1 ? 2 : 1));
  };

  return (
    <aside className="trip-sidebar-shell">
      {/* 🔘 FLOATING BUTTON */}
      <button
        className={`trip-sidebar-float-btn ${mode === 2 ? "rotate" : ""}`}
        onClick={toggle}
      >
        <ArrowLeftRight size={16} />
      </button>

      <div className="trip-sidebar-panels">
        <div className={clsx("panel", mode === 1 && "show")}>
          <TripSidebar />
        </div>

        <div className={clsx("panel", mode === 2 && "show")}>
          <LeftSidebar />
        </div>
      </div>
    </aside>
  );
}

import React from "react";
import "./TripiiTripLogo.css";

const TripiiTripLogo = () => {
  return (
    <div className="splash-root">
      {/* decorative blobs */}
      <div className="blob blob-teal" />
      <div className="blob blob-yellow" />

      <div className="splash-card">
        {/* Map + man */}
        <div className="map-card">
          🗺️
          <span className="man">🧍‍♂️</span>
        </div>

        {/* Brand */}
        <h1 className="brand">
          <span className="trip-yellow">Tripii</span>
          <span className="trip-white">Trip</span>
        </h1>

        <div className="smile" />

        <p className="tagline">Make Trips Memorable</p>

        {/* Loading */}
        <div className="loading-bar">
          <div className="loading-progress" />
        </div>
      </div>
    </div>
  );
};

export default TripiiTripLogo;

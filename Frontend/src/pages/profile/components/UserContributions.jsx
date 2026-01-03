import React, { useEffect, useState } from "react";
import styles from "./UserContributions.module.css";
import { getContributions } from "@/api/contribution";
import { MapPin } from "lucide-react"; // Import icon to match PostFeed style

const UserContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getContributions();
        if (response.success) {
          setContributions(response.data);
        }
      } catch (error) {
        console.error("Error fetching contributions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      {/* --- HEADER MATCHING POSTFEED --- */}
      <div className={styles.sectionHeader}>
        <MapPin className={styles.icon} size={20} />
        <h2>My Contributions</h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thLeft}>Place & Location</th>
              <th>Category</th>
              <th>Date Visited</th>
              <th>Rating</th>
              <th className={styles.thRight}>Status</th>
            </tr>
          </thead>
          <tbody>
            {contributions.length > 0 ? (
              contributions.map((item) => (
                <tr key={item._id} className={styles.row}>
                  <td className={styles.placeCell}>
                    <div className={styles.placeContent}>
                      <div className={styles.imgWrapper}>
                        <img
                          src={item.images[0]}
                          alt={item.placeName}
                          className={styles.thumbnail}
                        />
                      </div>
                      <div className={styles.placeText}>
                        <span className={styles.placeName}>
                          {item.placeName}
                        </span>
                        <span className={styles.placeLocation}>
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.categoryCell}>
                    <span className={styles.mainType}>{item.type}</span>
                    <span className={styles.subCategory}>{item.category}</span>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(item.dateOfVisit)}
                  </td>
                  <td className={styles.ratingCell}>
                    <span className={styles.stars}>
                      {renderStars(item.rating)}
                    </span>
                    <span className={styles.ratingNumber}>
                      ({item.rating}/5)
                    </span>
                  </td>
                  <td className={styles.statusCell}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[item.status.toLowerCase()]
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className={styles.emptyState}>
                  No contributions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserContributions;

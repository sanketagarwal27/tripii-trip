import styles from "./Profile.module.css";
import React, { useEffect, useState } from "react";
import ProfileSidebar from "./components/Sidebar";
import ProfileTabs from "./components/ProfileTabs";
import { getUserProfile, updateUserProfile } from "@/api/auth";
import EditProfileModal from "./components/EditProfile";
import { useParams } from "react-router-dom";
import PostFeed from "./components/PostFeed";

const TABS = ["Posts", "Trip Posts", "Saved", "Contribution Details"];

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Posts");

  const { id } = useParams();
  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await getUserProfile(id);
        setUserData(response.data);
      } catch (err) {
        console.log("Error in fetching: ", err);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [id]);

  const handleUpdateProfile = async (formDataObject) => {
    try {
      const updatedUser = await updateUserProfile(formDataObject);
      setUserData(updatedUser.data);
    } catch (error) {
      console.error("Failed to update profile", error);
      // Add a toast notification here for the error
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "Posts":
        // Shows only normal posts
        return (
          <PostFeed
            posts={userData.posts.filter((post) => post.type === "normal")}
            user={userData}
          />
        );

      case "Trip Posts":
        // Example: Filter for trip posts
        /* Note: If you are using the new 'ProfileFeed' component created previously 
           that separates Visual vs Log, you can use that here instead of PostFeed.
        */
        const tripPosts = userData.posts.filter((post) => post.type === "trip");
        return tripPosts.length > 0 ? (
          <PostFeed posts={tripPosts} />
        ) : (
          <div className={styles.emptyState}>No Trip Posts yet.</div>
        );

      case "Saved":
        return (
          <div className={styles.emptyState}>Saved items coming soon...</div>
        );

      case "Contribution Details":
        return (
          <div className={styles.emptyState}>Contribution stats here...</div>
        );

      default:
        return null;
    }
  };

  if (loading) return <center>Loading Your Profile...</center>;
  if (!userData) return <center>User Not Found...</center>;
  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <ProfileSidebar
          user={userData}
          onEditClick={() => setIsEditing(true)}
        />
        <main className={styles.mainContent}>
          {/* 1. The Tabs Component */}
          <ProfileTabs
            tabs={TABS}
            activeTab={selectedTab}
            onTabChange={setSelectedTab}
          />

          {/* 2. The Dynamic Content */}
          {renderTabContent()}
        </main>

        {/* Render modal if isEditing is true */}
        {isEditing && (
          <EditProfileModal
            user={userData}
            onClose={() => setIsEditing(false)}
            onSave={handleUpdateProfile}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

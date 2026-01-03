import styles from "./Profile.module.css";
import React, { useEffect, useMemo, useState } from "react";
import ProfileSidebar from "./components/Sidebar";
import ProfileTabs from "./components/ProfileTabs";
import { getUserProfile, updateUserProfile } from "@/api/auth";
import EditProfileModal from "./components/EditProfile";
import { useParams } from "react-router-dom";
import PostFeed from "./components/PostFeed";
import UserContributions from "./components/UserContributions";
import { useSelector } from "react-redux";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Posts");

  const { id } = useParams();
  const { userProfile } = useSelector((state) => state.auth);

  const isOwnProfile = userProfile?._id === id;

  const TABS = useMemo(() => {
    const baseTabs = ["Posts", "Trip Posts"];
    if (isOwnProfile) {
      return [...baseTabs, "Saved", "Contribution Details"];
    }
    return baseTabs;
  }, [isOwnProfile]);

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
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setUserData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        posts: prevData.posts.map((p) =>
          p._id === updatedPost._id ? updatedPost : p
        ),
      };
    });
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "Posts":
        return (
          <PostFeed
            posts={userData.posts.filter((post) => post.type === "normal")}
            user={userData}
            onPostUpdate={handlePostUpdate}
          />
        );

      case "Trip Posts":
        const tripPosts = userData.posts.filter((post) => post.type === "trip");
        return tripPosts.length > 0 ? (
          <PostFeed posts={tripPosts} onPostUpdate={handlePostUpdate} />
        ) : (
          <div className={styles.emptyState}>No Trip Posts yet.</div>
        );

      case "Saved":
        return <div className={styles.emptyState}>No Saved Posts yet...</div>;

      case "Contribution Details":
        return <UserContributions />;

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
          <ProfileTabs
            tabs={TABS}
            activeTab={selectedTab}
            onTabChange={setSelectedTab}
          />
          {renderTabContent()}
        </main>
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

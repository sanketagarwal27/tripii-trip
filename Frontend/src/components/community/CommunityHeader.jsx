// src/components/community/CommunityHeader.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { joinPublicCommunity } from "@/api/community";
import {
  setCommunityProfile,
  setMyCommunities,
  setSuggestedCommunities,
} from "@/redux/communitySlice";

const CommunityHeader = ({ profile }) => {
  const dispatch = useDispatch();
  const { my, suggested } = useSelector((s) => s.community);
  const isMember = profile?.isMember;

  const handleJoin = async () => {
    const res = await joinPublicCommunity(profile._id, "");
    const updated = res.data.data;

    dispatch(
      setCommunityProfile({
        ...updated,
        isMember: true,
        currentUserRole: "member",
      })
    );

    dispatch(
      setMyCommunities([updated, ...my.filter((c) => c._id !== updated._id)])
    );
    dispatch(
      setSuggestedCommunities(suggested.filter((c) => c._id !== updated._id))
    );
  };

  return (
    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${profile.backgroundImage?.url || ""})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative z-10 p-4 sm:p-6 flex items-end justify-between">
        <div className="text-white max-w-[70%]">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {profile.name}
          </h1>
        </div>

        {!isMember && (
          <button
            onClick={handleJoin}
            className="rounded-full px-4 py-2 bg-primary text-white font-bold"
          >
            Join Community
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityHeader;

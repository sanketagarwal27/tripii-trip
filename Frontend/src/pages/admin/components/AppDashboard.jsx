import React, { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Map,
  Navigation,
  Archive,
  FileText,
  CheckCircle2,
  XCircle,
  Building2,
  BadgeCheck,
  AlertCircle,
  BedDouble,
  Utensils,
  Briefcase,
  Mountain,
} from "lucide-react";
import { getAppOverview } from "@/api/admin";

/* -------------------- Page Loader -------------------- */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500" />
  </div>
);

const AppDashboard = () => {
  const [data, setData] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getResponse = async () => {
      try {
        const response = await getAppOverview();
        setData(response.data);
      } catch (err) {
        console.error("Dashboard fetch failed", err);
        setError("Failed to load dashboard data.");
      } finally {
        setPageLoading(false);
      }
    };
    getResponse();
  }, []);

  /* -------------------- Loading -------------------- */
  if (pageLoading) return <PageLoader />;

  /* -------------------- Error -------------------- */
  if (error)
    return (
      <div className="p-6 text-center text-red-600 font-semibold">{error}</div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Dashboard Overview
      </h2>

      {/* Section 1: User Management */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          User Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={data.totalUsers}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Active Users"
            value={data.activeUsers}
            icon={UserCheck}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="Banned Users"
            value={data.bannedUsers}
            icon={UserX}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </div>
      </div>

      {/* Section 2: Trip Activity */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Trip Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Trips"
            value={data.totalTrips}
            icon={Map}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <StatCard
            title="Ongoing Trips"
            value={data.ongoingTrips}
            icon={Navigation}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            title="Closed Trips"
            value={data.closedTrips}
            icon={Archive}
            color="text-gray-600"
            bgColor="bg-gray-100"
          />
        </div>
      </div>

      {/* Section 3: Contributions */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Contributions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Pending Review"
            value={data.pendingContributions}
            icon={FileText}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <StatCard
            title="Approved"
            value={data.approvedContributions}
            icon={CheckCircle2}
            color="text-teal-600"
            bgColor="bg-teal-50"
          />
          <StatCard
            title="Rejected"
            value={data.rejectedContributions}
            icon={XCircle}
            color="text-rose-600"
            bgColor="bg-rose-50"
          />
        </div>
      </div>

      {/* Section 4: Business Connections */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Business Connections
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Businesses"
            value={data.totalBusinesses}
            icon={Building2}
            color="text-violet-600"
            bgColor="bg-violet-50"
          />
          <StatCard
            title="Verified Businesses"
            value={data.verifiedBusinesses}
            icon={BadgeCheck}
            color="text-cyan-600"
            bgColor="bg-cyan-50"
          />
          <StatCard
            title="Unverified Businesses"
            value={data.unverifiedBusinesses}
            icon={AlertCircle}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
        </div>
      </div>

      {/* Section 5: Business Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Business Overview (By Type)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Accommodations"
            value={data.totalHotels}
            icon={BedDouble}
            color="text-pink-600"
            bgColor="bg-pink-50"
          />
          <StatCard
            title="Food & Dining"
            value={data.totalRestaurants}
            icon={Utensils}
            color="text-lime-600"
            bgColor="bg-lime-50"
          />
          <StatCard
            title="Travel Agencies"
            value={data.totalAgencies}
            icon={Briefcase}
            color="text-sky-600"
            bgColor="bg-sky-50"
          />
          <StatCard
            title="Activity Providers"
            value={data.totalActivities}
            icon={Mountain}
            color="text-fuchsia-600"
            bgColor="bg-fuchsia-50"
          />
        </div>
      </div>
    </div>
  );
};

/* -------------------- Reusable Stat Card -------------------- */
const StatCard = ({ title, value, icon: Icon, color, bgColor }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-800 mt-0.5">
          {value ?? "-"}
        </h4>
      </div>
    </div>
  );
};

export default AppDashboard;

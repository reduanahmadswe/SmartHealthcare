import React, { useEffect, useState } from "react";
import {
  IoAnalyticsOutline,
  IoCheckmarkCircleOutline,
  IoClipboardOutline,
  IoCloseCircleOutline,
  IoFileTrayOutline,
  IoMedicalOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingKYC: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userStats, setUserStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, doctorsRes, appointmentsRes, analyticsRes, activityRes] =
        await Promise.all([
          api.get("/users"),
          api.get("/doctors"),
          api.get("/appointments"),
          api.get("/analytics"),
          api.get("/logs"),
        ]);

      const users = usersRes.data;
      const doctors = doctorsRes.data;
      const appointments = appointmentsRes.data;
      const analytics = analyticsRes.data;
      const activities = activityRes.data;

      const pendingKYC = doctors.filter((doctor) => !doctor.isVerified);

      setStats({
        totalUsers: users.length,
        totalDoctors: doctors.length,
        totalPatients: users.filter((user) => user.role === "patient").length,
        pendingKYC: pendingKYC.length,
        totalAppointments: appointments.length,
        totalRevenue: analytics.totalRevenue || 0,
      });

      setPendingDoctors(pendingKYC.slice(0, 5));
      setRecentActivity(activities.slice(0, 10));

      // User distribution for pie chart
      setUserStats([
        {
          name: "Patients",
          value: users.filter((user) => user.role === "patient").length,
          color: "#3b82f6",
        },
        { name: "Doctors", value: doctors.length, color: "#10b981" },
        {
          name: "Admins",
          value: users.filter((user) => user.role === "admin").length,
          color: "#f59e0b",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCApproval = async (doctorId, action) => {
    try {
      await api.patch(`/admin/doctors/${doctorId}/${action}`);
      toast.success(
        `Doctor ${action === "approve" ? "approved" : "rejected"} successfully`
      );
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating KYC status:", error);
      toast.error("Failed to update KYC status");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-purple-100">
            Here's your system overview and analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-grid">
          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900">
                <IoPeopleOutline className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-900">
                <IoMedicalOutline className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Doctors
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalDoctors}
                </p>
              </div>
            </div>
          </Card>

          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-warning-100 dark:bg-warning-900">
                <IoCheckmarkCircleOutline className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending KYC
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.pendingKYC}
                </p>
              </div>
            </div>
          </Card>

          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <IoStatsChartOutline className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* User Distribution Chart */}
        <Card>
          <Card.Header>
            <Card.Title>User Distribution</Card.Title>
            <Card.Description>Breakdown of users by role</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
            <Card.Description>Access administrative features</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/doctor-kyc"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-warning-300 hover:bg-warning-50 dark:border-gray-700 dark:hover:border-warning-600 dark:hover:bg-warning-900/20 transition-colors"
              >
                <IoCheckmarkCircleOutline className="h-8 w-8 text-warning-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Doctor KYC
                </span>
              </Link>

              <Link
                to="/analytics"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 transition-colors"
              >
                <IoAnalyticsOutline className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Analytics
                </span>
              </Link>

              <Link
                to="/inventory"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-secondary-300 hover:bg-secondary-50 dark:border-gray-700 dark:hover:border-secondary-600 dark:hover:bg-secondary-900/20 transition-colors"
              >
                <IoFileTrayOutline className="h-8 w-8 text-secondary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Inventory
                </span>
              </Link>

              <Link
                to="/logs"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 transition-colors"
              >
                <IoClipboardOutline className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Activity Logs
                </span>
              </Link>
            </div>
          </Card.Content>
        </Card>

        {/* Pending KYC Requests */}
        <Card>
          <Card.Header>
            <Card.Title>Pending KYC Requests</Card.Title>
            <Card.Description>
              Review and approve doctor verification requests
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {pendingDoctors.length > 0 ? (
              <div className="space-y-4">
                {pendingDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-warning-100 dark:bg-warning-900">
                        <IoMedicalOutline className="h-5 w-5 text-warning-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doctor.specialization} • {doctor.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          License: {doctor.licenseNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleKYCApproval(doctor._id, "approve")}
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleKYCApproval(doctor._id, "reject")}
                      >
                        <IoCloseCircleOutline className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoCheckmarkCircleOutline className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No pending KYC requests
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
            <Card.Description>
              Latest system activities and logs
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <IoClipboardOutline className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoClipboardOutline className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No recent activity
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

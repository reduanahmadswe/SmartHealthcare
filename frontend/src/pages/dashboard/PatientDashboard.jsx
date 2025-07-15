import React, { useEffect, useState } from "react";
import {
  IoCalendarOutline,
  IoChatbubbleOutline,
  IoDocumentTextOutline,
  IoFileTrayOutline,
  IoHeartOutline,
  IoMedicalOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointments: 0,
    prescriptions: 0,
    healthData: 0,
    reports: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [healthData, setHealthData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        appointmentsRes,
        patientsRes,
        prescriptionsRes,
        healthDataRes,
        reportsRes,
      ] = await Promise.all([
        api.get("/appointments/patient"),
        api.get(`/doctors/${user._id}/patients`),
        api.get("/prescriptions/patient"),
        api.get("/health-data/patient"),
        api.get("/medical-records/patient"),
      ]);

      setStats({
        appointments: appointmentsRes.data.length,
        prescriptions: prescriptionsRes.data.length,
        healthData: healthDataRes.data.length,
        reports: reportsRes.data.length,
      });

      setRecentAppointments(appointmentsRes.data.slice(0, 5));
      setHealthData(healthDataRes.data.slice(-7)); // Last 7 days
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: "badge-primary",
      confirmed: "badge-success",
      completed: "badge-secondary",
      cancelled: "badge-danger",
    };
    return statusClasses[status] || "badge-outline";
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
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-primary-100">
            Here's what's happening with your health today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-grid">
          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900">
                <IoCalendarOutline className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Appointments
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.appointments}
                </p>
              </div>
            </div>
          </Card>

          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-900">
                <IoDocumentTextOutline className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Prescriptions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.prescriptions}
                </p>
              </div>
            </div>
          </Card>

          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <IoHeartOutline className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Health Records
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.healthData}
                </p>
              </div>
            </div>
          </Card>

          <Card className="stats-card">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <IoFileTrayOutline className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Medical Reports
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.reports}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
            <Card.Description>
              Access your most important features
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/book-appointment"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 transition-colors"
              >
                <IoCalendarOutline className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Book Appointment
                </span>
              </Link>

              <Link
                to="/health-data"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-secondary-300 hover:bg-secondary-50 dark:border-gray-700 dark:hover:border-secondary-600 dark:hover:bg-secondary-900/20 transition-colors"
              >
                <IoHeartOutline className="h-8 w-8 text-secondary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Health Data
                </span>
              </Link>

              <Link
                to="/chat"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 dark:border-gray-700 dark:hover:border-yellow-600 dark:hover:bg-yellow-900/20 transition-colors"
              >
                <IoChatbubbleOutline className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Chat with Doctor
                </span>
              </Link>

              <Link
                to="/prescriptions"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 transition-colors"
              >
                <IoDocumentTextOutline className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Prescriptions
                </span>
              </Link>
            </div>
          </Card.Content>
        </Card>

        {/* Health Data Chart */}
        {healthData.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>Health Trends</Card.Title>
              <Card.Description>
                Your health data over the last 7 days
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bloodPressure"
                      stroke="#3b82f6"
                    />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#ef4444"
                    />
                    <Line
                      type="monotone"
                      dataKey="bloodSugar"
                      stroke="#10b981"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Recent Appointments */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Appointments</Card.Title>
            <Card.Description>
              Your upcoming and recent appointments
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900">
                        <IoMedicalOutline className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Dr. {appointment.doctor?.firstName}{" "}
                          {appointment.doctor?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(appointment.date).toLocaleDateString()} at{" "}
                          {new Date(appointment.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`badge ${getStatusBadge(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoCalendarOutline className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No appointments scheduled
                </p>
                <Button as={Link} to="/book-appointment" className="mt-4">
                  Book Your First Appointment
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;

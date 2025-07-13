import {
    CalendarIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    HeartIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';

const PatientHome = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [healthVitals, setHealthVitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming appointments
        const appointmentsResponse = await appointmentService.getUpcomingAppointments();
        setUpcomingAppointments(appointmentsResponse.data.appointments || []);

        // Mock health vitals data (in real app, this would come from API)
        setHealthVitals([
          {
            id: 1,
            name: 'Blood Pressure',
            value: '120/80',
            unit: 'mmHg',
            status: 'normal',
            trend: 'stable',
            icon: HeartIcon,
          },
          {
            id: 2,
            name: 'Heart Rate',
            value: '72',
            unit: 'bpm',
            status: 'normal',
            trend: 'stable',
            icon: HeartIcon,
          },
          {
            id: 3,
            name: 'Blood Sugar',
            value: '95',
            unit: 'mg/dL',
            status: 'normal',
            trend: 'stable',
            icon: ChartBarIcon,
          },
          {
            id: 4,
            name: 'Temperature',
            value: '98.6',
            unit: '°F',
            status: 'normal',
            trend: 'stable',
            icon: ChartBarIcon,
          },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      name: 'Book Appointment',
      href: '/patient/book-appointment',
      icon: CalendarIcon,
      color: 'bg-primary-500',
      description: 'Schedule a consultation with a doctor',
    },
    {
      name: 'View Health Data',
      href: '/patient/health-data',
      icon: ChartBarIcon,
      color: 'bg-success-500',
      description: 'Monitor your health metrics',
    },
    {
      name: 'Chat with Doctor',
      href: '/patient/chat',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-warning-500',
      description: 'Get instant medical advice',
    },
    {
      name: 'View Prescriptions',
      href: '/patient/prescriptions',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      description: 'Access your medication history',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-success-600 bg-success-100';
      case 'warning':
        return 'text-warning-600 bg-warning-100';
      case 'danger':
        return 'text-danger-600 bg-danger-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'danger':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-primary rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-blue-100 mt-1">
              Here's what's happening with your health today
            </p>
          </div>
          <div className="hidden md:block">
            <UserGroupIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.name}
              to={action.href}
              className="card p-4 hover:shadow-medium transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{action.name}</h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Vitals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Vitals</h2>
          <div className="space-y-3">
            {healthVitals.map((vital) => (
              <div
                key={vital.id}
                className={`health-vital-${vital.status} p-4`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <vital.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{vital.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-lg font-semibold text-gray-900">
                        {vital.value} {vital.unit}
                      </span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vital.status)}`}>
                        {getStatusIcon(vital.status)}
                        <span className="ml-1 capitalize">{vital.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link
              to="/patient/appointments"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed' ? 'bg-success-100 text-success-800' :
                          appointment.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.appointmentType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.appointmentMode}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No upcoming appointments</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Schedule your next appointment to get started
                </p>
                <Link
                  to="/patient/book-appointment"
                  className="btn-primary text-sm"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="card">
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircleIcon className="h-4 w-4 text-success-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Appointment confirmed with Dr. Smith
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DocumentTextIcon className="h-4 w-4 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    New prescription uploaded
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-warning-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Message received from Dr. Johnson
                  </p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientHome; 
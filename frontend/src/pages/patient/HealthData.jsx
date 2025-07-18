import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { IoAddOutline, IoHeartOutline } from "react-icons/io5";
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
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";

const HealthData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [timeRange, setTimeRange] = useState("week");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchHealthData();
  }, [timeRange]);

  const fetchHealthData = async () => {
    try {
      const response = await api.get(
        `/health/${user._id}?timeRange=${timeRange}`
      );
      setHealthData(response.data);
    } catch (error) {
      console.error("Error fetching health data:", error);
      toast.error("Failed to load health data");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await api.post("/health/add", { ...data, patientId: user._id });
      toast.success("Health data added successfully");
      setShowForm(false);
      reset();
      fetchHealthData();
    } catch (error) {
      console.error("Error adding health data:", error);
      toast.error("Failed to add health data");
    }
  };

  const getVitalStatus = (type, value) => {
    const ranges = {
      bloodPressure: { normal: [90, 140], warning: [140, 160] },
      heartRate: { normal: [60, 100], warning: [100, 120] },
      bloodSugar: { normal: [70, 140], warning: [140, 200] },
      temperature: { normal: [97, 99], warning: [99, 101] },
      weight: { normal: [50, 100], warning: [100, 120] },
    };

    const range = ranges[type];
    if (!range) return "normal";

    if (value >= range.normal[0] && value <= range.normal[1]) return "normal";
    if (value >= range.warning[0] && value <= range.warning[1])
      return "warning";
    return "danger";
  };

  const getStatusColor = (status) => {
    const colors = {
      normal:
        "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400",
      warning:
        "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400",
      danger: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400",
    };
    return colors[status] || colors.normal;
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Health Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and monitor your vital signs
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <IoAddOutline className="mr-2 h-5 w-5" />
            Add Data
          </Button>
        </div>

        {/* Time Range Selector */}
        <Card>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </span>
            <div className="flex space-x-2">
              {["week", "month", "year"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Health Data Chart */}
        {healthData.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>Health Trends</Card.Title>
              <Card.Description>
                Your vital signs over the selected time period
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="h-80">
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
                      name="Blood Pressure"
                    />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#ef4444"
                      name="Heart Rate"
                    />
                    <Line
                      type="monotone"
                      dataKey="bloodSugar"
                      stroke="#10b981"
                      name="Blood Sugar"
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f59e0b"
                      name="Temperature"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Latest Readings */}
        <Card>
          <Card.Header>
            <Card.Title>Latest Readings</Card.Title>
            <Card.Description>
              Your most recent health measurements
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {healthData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.slice(-6).map((data, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {new Date(data.date).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          getVitalStatus("bloodPressure", data.bloodPressure)
                        )}`}
                      >
                        {getVitalStatus("bloodPressure", data.bloodPressure)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Blood Pressure:
                        </span>
                        <span className="font-medium">
                          {data.bloodPressure} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Heart Rate:
                        </span>
                        <span className="font-medium">
                          {data.heartRate} bpm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Blood Sugar:
                        </span>
                        <span className="font-medium">
                          {data.bloodSugar} mg/dL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Temperature:
                        </span>
                        <span className="font-medium">
                          {data.temperature}°F
                        </span>
                      </div>
                      {data.weight && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Weight:
                          </span>
                          <span className="font-medium">{data.weight} kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoHeartOutline className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No health data available
                </p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  Add Your First Reading
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Add Health Data Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Add Health Data
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Blood Pressure (mmHg)"
                  type="number"
                  required
                  error={errors.bloodPressure?.message}
                  {...register("bloodPressure", {
                    required: "Blood pressure is required",
                    min: {
                      value: 50,
                      message: "Blood pressure must be at least 50",
                    },
                    max: {
                      value: 200,
                      message: "Blood pressure must be less than 200",
                    },
                  })}
                />
                <Input
                  label="Heart Rate (bpm)"
                  type="number"
                  required
                  error={errors.heartRate?.message}
                  {...register("heartRate", {
                    required: "Heart rate is required",
                    min: {
                      value: 40,
                      message: "Heart rate must be at least 40",
                    },
                    max: {
                      value: 200,
                      message: "Heart rate must be less than 200",
                    },
                  })}
                />
                <Input
                  label="Blood Sugar (mg/dL)"
                  type="number"
                  required
                  error={errors.bloodSugar?.message}
                  {...register("bloodSugar", {
                    required: "Blood sugar is required",
                    min: {
                      value: 50,
                      message: "Blood sugar must be at least 50",
                    },
                    max: {
                      value: 400,
                      message: "Blood sugar must be less than 400",
                    },
                  })}
                />
                <Input
                  label="Temperature (°F)"
                  type="number"
                  step="0.1"
                  required
                  error={errors.temperature?.message}
                  {...register("temperature", {
                    required: "Temperature is required",
                    min: {
                      value: 90,
                      message: "Temperature must be at least 90°F",
                    },
                    max: {
                      value: 110,
                      message: "Temperature must be less than 110°F",
                    },
                  })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  error={errors.weight?.message}
                  {...register("weight", {
                    min: { value: 20, message: "Weight must be at least 20kg" },
                    max: {
                      value: 200,
                      message: "Weight must be less than 200kg",
                    },
                  })}
                />
                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    Save Data
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HealthData;

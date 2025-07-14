import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMedicalOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <IoMedicalOutline className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join Smart Healthcare today
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                error={errors.firstName?.message}
                {...register("firstName", {
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                  maxLength: {
                    value: 50,
                    message: "First name must be at most 50 characters",
                  },
                })}
              />
              <Input
                label="Last Name"
                required
                error={errors.lastName?.message}
                {...register("lastName", {
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                  maxLength: {
                    value: 50,
                    message: "Last name must be at most 50 characters",
                  },
                })}
              />
            </div>

            <Input
              label="Email"
              type="email"
              required
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              required
              error={errors.phone?.message}
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^[+]?\d{10,16}$/,
                  message: "Invalid phone number",
                },
              })}
            />

            <Input
              label="Date of Birth"
              type="date"
              required
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth", {
                required: "Date of birth is required",
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender <span className="text-danger-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="male"
                    {...register("gender", {
                      required: "Please select a gender",
                    })}
                    className="mr-2"
                  />
                  Male
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="female"
                    {...register("gender", {
                      required: "Please select a gender",
                    })}
                    className="mr-2"
                  />
                  Female
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="other"
                    {...register("gender", {
                      required: "Please select a gender",
                    })}
                    className="mr-2"
                  />
                  Other
                </label>
              </div>
              {errors.gender && (
                <p className="text-sm text-danger-600 dark:text-danger-400 mt-1">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role <span className="text-danger-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    value="patient"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    {...register("role", { required: "Please select a role" })}
                  />
                  <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                    Patient
                  </span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    value="doctor"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    {...register("role", { required: "Please select a role" })}
                  />
                  <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                    Doctor
                  </span>
                </label>
              </div>
              {errors.role && (
                <p className="text-sm text-danger-600 dark:text-danger-400 mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IoEyeOffOutline className="h-5 w-5" />
                ) : (
                  <IoEyeOutline className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                required
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <IoEyeOffOutline className="h-5 w-5" />
                ) : (
                  <IoEyeOutline className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Optional: Address */}
            <Input
              label="Address"
              error={errors.address?.message}
              {...register("address")}
            />

            {/* Optional: Emergency Contact */}
            <Input
              label="Emergency Contact"
              error={errors.emergencyContact?.message}
              {...register("emergencyContact")}
            />

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register("terms", {
                  required: "You must accept the terms and conditions",
                })}
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {errors.terms.message}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-100 dark:hover:bg-primary-800"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

import React, { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { userService } from "../../services/userService";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile();
      setProfile(data);
      if (data.profilePicture) {
        setPreviewUrl(data.profilePicture);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfile((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await userService.updateUserProfile(profile);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return;

    try {
      setSaving(true);
      await userService.uploadProfilePicture(profilePicture);
      setProfilePicture(null);
      setMessage({
        type: "success",
        text: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setMessage({ type: "error", text: "Failed to upload profile picture" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information and account settings
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                required
              />

              <Input
                label="Phone"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={handleProfileChange}
                />
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleProfileChange}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Address"
                name="address"
                value={profile.address}
                onChange={handleProfileChange}
                multiline
              />

              <Button onClick={saveProfile} loading={saving} className="w-full">
                Save Profile
              </Button>
            </Card.Content>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Input
                label="Contact Name"
                name="emergencyContact.name"
                value={profile.emergencyContact?.name || ""}
                onChange={handleProfileChange}
              />

              <Input
                label="Contact Phone"
                name="emergencyContact.phone"
                value={profile.emergencyContact?.phone || ""}
                onChange={handleProfileChange}
              />

              <Input
                label="Relationship"
                name="emergencyContact.relationship"
                value={profile.emergencyContact?.relationship || ""}
                onChange={handleProfileChange}
              />
            </Card.Content>
          </Card>
        </div>

        {/* Profile Picture */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Profile Picture</h3>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {profilePicture && (
                  <Button
                    onClick={uploadProfilePicture}
                    loading={saving}
                    className="mt-2"
                    size="sm"
                  >
                    Upload Picture
                  </Button>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Change Password */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Change Password</h3>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <Button
              onClick={changePassword}
              loading={changingPassword}
              disabled={
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
              className="w-full"
            >
              Change Password
            </Button>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

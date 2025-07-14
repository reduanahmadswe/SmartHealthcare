import React from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DashboardLayout from "../../layouts/DashboardLayout";

const AdminSettings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Profile Settings</Card.Title>
            <Card.Description>Update your profile information</Card.Description>
          </Card.Header>
          <Card.Content>
            {/* Profile update form placeholder */}
            <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Profile update form will go here.
            </p>
            <Button className="mt-4" disabled>
              Save Changes
            </Button>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Change Password</Card.Title>
            <Card.Description>Update your account password</Card.Description>
          </Card.Header>
          <Card.Content>
            {/* Change password form placeholder */}
            <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Change password form will go here.
            </p>
            <Button className="mt-4" disabled>
              Change Password
            </Button>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Notification Preferences</Card.Title>
            <Card.Description>
              Manage your notification settings
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {/* Notification preferences form placeholder */}
            <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Notification preferences form will go here.
            </p>
            <Button className="mt-4" disabled>
              Save Preferences
            </Button>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;

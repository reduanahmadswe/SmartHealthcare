import React from "react";
import { IoArrowBack, IoHomeOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import Button from "../components/Button";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button as={Link} to="/" variant="outline">
            <IoHomeOutline className="mr-2 h-5 w-5" />
            Go Home
          </Button>
          <Button as={Link} to="/login">
            <IoArrowBack className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

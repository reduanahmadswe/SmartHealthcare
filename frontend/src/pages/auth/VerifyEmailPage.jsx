import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/Button";
import api from "../../services/api";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then((res) => {
        setStatus("success");
        setMessage("Your email has been verified! You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verification failed. The link may have expired or is invalid."
        );
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        {status === "verifying" && <p>Verifying your email...</p>}
        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Success!</h2>
            <p className="mb-6">{message}</p>
            <Button as={Link} to="/login">
              Go to Login
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              Verification Failed
            </h2>
            <p className="mb-6">{message}</p>
            <Button as={Link} to="/">
              Go to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

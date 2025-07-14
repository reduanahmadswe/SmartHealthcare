import React from "react";
import { IoArrowForward, IoMedicalOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import Button from "../components/Button";

const LandingPage = () => {
  const features = [
    {
      title: "Easy Appointment Booking",
      description: "Book appointments with doctors in just a few clicks",
      icon: "🏥",
    },
    {
      title: "Health Data Tracking",
      description: "Monitor your vital signs and health metrics",
      icon: "📊",
    },
    {
      title: "Secure Chat",
      description: "Communicate with your doctor securely",
      icon: "💬",
    },
    {
      title: "Digital Prescriptions",
      description: "Receive and manage prescriptions digitally",
      icon: "📋",
    },
    {
      title: "Payment Integration",
      description: "Secure payment processing for all services",
      icon: "💳",
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock customer support",
      icon: "🆘",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <IoMedicalOutline className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Smart Health
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Sign In
              </Link>
              <Button as={Link} to="/register">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Your Health,
            <span className="text-primary-600 dark:text-primary-400">
              {" "}
              Simplified
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the future of healthcare with our comprehensive digital
            platform. Connect with doctors, track your health, and manage your
            medical records all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button as={Link} to="/register" size="lg">
              Start Your Journey
              <IoArrowForward className="ml-2 h-5 w-5" />
            </Button>
            <Button as={Link} to="/login" variant="outline" size="lg">
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Why Choose Smart Health?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Comprehensive healthcare solutions designed for modern life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 dark:bg-primary-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of patients and doctors who trust Smart Health
          </p>
          <Button as={Link} to="/register" size="lg" variant="secondary">
            Get Started Today
            <IoArrowForward className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <IoMedicalOutline className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold">Smart Health</span>
              </div>
              <p className="text-gray-400">
                Transforming healthcare through technology and innovation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Patients</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/login" className="hover:text-white">
                    Book Appointments
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Health Tracking
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Prescriptions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Doctors</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/login" className="hover:text-white">
                    Patient Management
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Digital Prescriptions
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/login" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Smart Health. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

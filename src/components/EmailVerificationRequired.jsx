import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';

const EmailVerificationRequired = ({ email, onResend, isLoading }) => {
  const navigate = useNavigate();

  const handleVerify = () => {
    navigate('/verify-email', { state: { email } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <Mail className="h-6 w-6 text-yellow-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Email Verification Required</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please verify your email address to continue
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                We've sent a verification code to:
              </p>
              <p className="font-medium text-blue-600">{email}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleVerify}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enter Verification Code
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <button
                onClick={onResend}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;
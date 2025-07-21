import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Star,
  Shield,
  Zap,
  Clock,
  RefreshCw,
  CreditCard,
  User
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import apiService from '../services/api';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SubscriptionDetails = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Essential premium features
  const premiumFeatures = [
    { icon: Crown, text: 'Premium badge on profile', color: 'text-yellow-600' },
    { icon: Star, text: 'Priority customer support', color: 'text-blue-600' },
    { icon: Shield, text: 'Advanced privacy controls', color: 'text-green-600' },
    { icon: Zap, text: 'Unlimited post uploads', color: 'text-purple-600' }
  ];

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getSubscriptionDetails();
      
      if (response.success) {
        setSubscriptionData(response.data);
      } else {
        setError(response.message || 'Failed to fetch subscription details');
      }
    } catch (err) {
      console.error('Error fetching subscription details:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await apiService.createCheckoutSession();
      
      if (response.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError(response.message || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to initiate payment process');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose premium benefits at the end of your current billing period.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      const response = await apiService.cancelSubscription();
      
      if (response.success) {
        setSuccess('Subscription canceled successfully. You will retain premium benefits until the end of your current billing period.');
        fetchSubscriptionDetails();
      } else {
        setError(response.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await apiService.reactivateSubscription();
      
      if (response.success) {
        setSuccess('Subscription reactivated successfully!');
        fetchSubscriptionDetails();
      } else {
        setError(response.message || 'Failed to reactivate subscription');
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setError('Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateWithTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'canceled':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'past_due':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      case 'past_due':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg text-gray-600">Loading subscription details...</span>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(subscriptionData?.subscriptionEndDate);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Crown className="w-8 h-8 mr-3 text-yellow-500" />
              Subscription Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your premium subscription and billing</p>
          </div>
          {subscriptionData?.isPremium && (
            <div className="flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-3 rounded-full border border-yellow-200">
              <Crown className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-semibold">Premium Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Current Plan Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Plan Status</h2>
        
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg mb-6">
          <div className="flex items-center">
            {subscriptionData?.subscriptionType === 'premium' ? (
              <Crown className="w-12 h-12 text-yellow-500 mr-4" />
            ) : (
              <User className="w-12 h-12 text-gray-500 mr-4" />
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 capitalize">
                {subscriptionData?.subscriptionType || 'Basic'} Plan
              </h3>
              <p className="text-gray-600 mt-1">
                {subscriptionData?.subscriptionType === 'premium' 
                  ? 'Full access to all premium features' 
                  : 'Limited access to basic features'
                }
              </p>
            </div>
          </div>
          
          {subscriptionData?.subscriptionStatus && (
            <div className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(subscriptionData.subscriptionStatus)}`}>
              {getStatusIcon(subscriptionData.subscriptionStatus)}
              <span className="ml-2 capitalize">{subscriptionData.subscriptionStatus}</span>
            </div>
          )}
        </div>

        {/* Premium Features Display */}
        {subscriptionData?.isPremium && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Premium Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                  <feature.icon className={`w-5 h-5 mr-3 ${feature.color}`} />
                  <span className="text-sm text-gray-700 font-medium flex-1">{feature.text}</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Subscription Details */}
        {subscriptionData?.isPremium && (
          <>
            {/* Days Remaining Alert */}
            {daysRemaining !== null && (
              <div className={`p-4 rounded-lg mb-6 ${daysRemaining <= 7 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center">
                  <Clock className={`w-5 h-5 mr-2 ${daysRemaining <= 7 ? 'text-red-600' : 'text-blue-600'}`} />
                  <span className={`font-semibold ${daysRemaining <= 7 ? 'text-red-800' : 'text-blue-800'}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Subscription expired'}
                  </span>
                </div>
              </div>
            )}

            {/* Subscription Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center text-green-700 mb-3">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Subscription Started</span>
                </div>
                <p className="text-lg font-bold text-green-800">
                  {formatDate(subscriptionData.subscriptionStartDate)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {formatDateWithTime(subscriptionData.subscriptionStartDate)}
                </p>
              </div>

              <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center text-blue-700 mb-3">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-semibold">
                    {subscriptionData.subscriptionCanceledAt ? 'Access Ends' : 'Next Billing'}
                  </span>
                </div>
                <p className="text-lg font-bold text-blue-800">
                  {formatDate(subscriptionData.subscriptionEndDate)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {formatDateWithTime(subscriptionData.subscriptionEndDate)}
                </p>
              </div>
            </div>

            {/* Current Billing Period */}
            <div className="p-5 bg-purple-50 rounded-lg border border-purple-200 mb-6">
              <div className="flex items-center text-purple-700 mb-3">
                <CreditCard className="w-5 h-5 mr-2" />
                <span className="font-semibold">Current Billing Period</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Period Start</p>
                  <p className="text-purple-800 font-bold">
                    {formatDate(subscriptionData.subscriptionCurrentPeriodStart)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Period End</p>
                  <p className="text-purple-800 font-bold">
                    {formatDate(subscriptionData.subscriptionCurrentPeriodEnd)}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Notice */}
            {subscriptionData.subscriptionCanceledAt && (
              <div className="p-5 bg-orange-50 rounded-lg border border-orange-200 mb-6">
                <div className="flex items-center text-orange-700 mb-3">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Cancellation Notice</span>
                </div>
                <div className="space-y-2">
                  <p className="text-orange-800">
                    <span className="font-medium">Canceled on:</span> {formatDate(subscriptionData.subscriptionCanceledAt)}
                  </p>
                  <p className="text-orange-800">
                    <span className="font-medium">Access until:</span> {formatDate(subscriptionData.subscriptionEndDate)}
                  </p>
                  <p className="text-sm text-orange-600 mt-2">
                    You'll retain all premium features until your subscription ends.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Upgrade to Premium Section for Basic Users */}
        {!subscriptionData?.isPremium && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Upgrade to Premium</h3>
            
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-600 ml-1">/month</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                  <feature.icon className={`w-5 h-5 mr-3 ${feature.color}`} />
                  <span className="text-sm text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgradeToPremium}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg"
            >
              {actionLoading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Crown className="w-5 h-5 mr-2" />
                  Get Premium Now
                </div>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {subscriptionData?.isPremium && (
            <>
              {subscriptionData.subscriptionCanceledAt ? (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors font-semibold"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Reactivate Subscription
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors font-semibold"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  Cancel Subscription
                </button>
              )}
            </>
          )}
          
          <button
            onClick={fetchSubscriptionDetails}
            disabled={loading}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Support */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
        <div className="flex flex-wrap gap-4">
          <a 
            href="#" 
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors p-3 rounded-lg hover:bg-blue-50"
          >
            <Shield className="w-5 h-5 mr-2" />
            <span className="font-medium">Contact Support</span>
          </a>
          <a 
            href="#" 
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors p-3 rounded-lg hover:bg-blue-50"
          >
            <Star className="w-5 h-5 mr-2" />
            <span className="font-medium">Billing FAQ</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;
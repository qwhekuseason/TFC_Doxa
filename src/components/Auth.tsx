import React, { useState, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import PhoneInput from 'react-phone-input-2';
import { Eye, EyeOff, Mail, Lock, User, Heart, Phone, Shield } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupType, setSignupType] = useState<'member' | 'admin_request'>('member');

  const { login, signup } = useAuth();
  const theme = useContext(ThemeContext);
  const isDarkMode = theme?.isDarkMode ?? false;

  const validateForm = () => {
    if (!email || !password) return 'Email and password are required';
    if (!isLogin) {
      if (!displayName) return 'Display name is required';
      if (!phoneNumber) return 'Phone number is required';
      if (password !== confirmPassword) return 'Passwords do not match';
      if (password.length < 6) return 'Password must be at least 6 characters';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // For admin requests, create a pending admin request
        if (signupType === 'admin_request') {
          await (signup as any)(email, password, {
            displayName,
            phoneNumber,
            role: 'admin',
            status: 'pending',
            requestDetails: {
              reason: 'New admin account request',
              phoneNumber,
              timestamp: new Date()
            }
          });
        } else {
          // Regular member signup
          await (signup as any)(email, password, {
            displayName,
            phoneNumber,
            role: 'member'
          });
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 
      ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'}`}>
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 
            rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 
            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            The Faithful City
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Connect with your church family
          </p>
        </div>

        {/* Auth Form */}
        <div className={`rounded-3xl shadow-xl p-8 
          ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Login/Signup toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-4 py-2 rounded-md transition-all ${
                  isLogin ? 'bg-white dark:bg-gray-800 shadow' : ''
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-4 py-2 rounded-md transition-all ${
                  !isLogin ? 'bg-white dark:bg-gray-800 shadow' : ''
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="block mb-2">Account Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSignupType('member')}
                  className={`flex-1 p-3 rounded-lg border ${
                    signupType === 'member' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : ''
                  }`}
                >
                  <User className="w-5 h-5 mb-2 mx-auto" />
                  <div className="text-sm font-medium">Family Member</div>
                </button>
                <button
                  onClick={() => setSignupType('admin_request')}
                  className={`flex-1 p-3 rounded-lg border ${
                    signupType === 'admin_request'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : ''
                  }`}
                >
                  <Shield className="w-5 h-5 mb-2 mx-auto" />
                  <div className="text-sm font-medium">Request Admin Access</div>
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className={`text-2xl font-bold mb-2 
              ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </h2>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {isLogin ? 'Sign in to continue' : 'Fill in your details to get started'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 
                      ${isDarkMode ? 
                        'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 
                        'bg-white border-gray-200 focus:ring-purple-200'}`}
                    placeholder="Full Name"
                  />
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>

                <div className="relative">
                  <PhoneInput
                    country={'us'}
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    inputClass={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 
                      ${isDarkMode ? 
                        'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 
                        'bg-white border-gray-200 focus:ring-purple-200'}`}
                    containerClass="phone-input"
                  />
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5 z-10" />
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 
                  ${isDarkMode ? 
                    'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 
                    'bg-white border-gray-200 focus:ring-purple-200'}`}
                placeholder="Email address"
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 rounded-xl border focus:ring-2 
                  ${isDarkMode ? 
                    'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 
                    'bg-white border-gray-200 focus:ring-purple-200'}`}
                placeholder="Password"
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5"
              >
                {showPassword ? 
                  <EyeOff className="w-5 h-5 text-gray-400" /> : 
                  <Eye className="w-5 h-5 text-gray-400" />
                }
              </button>
            </div>

            {!isLogin && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border focus:ring-2 
                    ${isDarkMode ? 
                      'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 
                      'bg-white border-gray-200 focus:ring-purple-200'}`}
                  placeholder="Confirm Password"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-medium
                ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-600 to-blue-600'}
                transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed`}
            >
              {loading ? 'Please wait...' : (
                isLogin ? 'Sign In' : 
                signupType === 'admin_request' ? 'Submit Admin Request' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
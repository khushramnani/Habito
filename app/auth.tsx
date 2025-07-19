import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../contexts/themeContext'
import { useAuth } from './context/authContext'

export default function Auth() {
  const [text, setText] = useState<Boolean>(true)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showNameInput, setShowNameInput] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const { signIn, signUp, completeSignUp , signInWithGoogle } = useAuth()

  const handleNameSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const error = await completeSignUp(name.trim())
      if (error) {
        setError(error)
      }
      // If successful, the auth context will handle navigation
    } catch (error) {
      setError('Failed to save your name. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const error = await signInWithGoogle();
    if (error) {
      setError(error);
    }
  } catch (error) {
    setError('Google sign-in failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleAuth = () => {
    if (text) {
      // Sign in
      if (!email || !password) {
        setError('Please fill in all fields')
        return
      }
    } else {
      // Sign up
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setError(null) // Clear any previous errors
    setIsLoading(true)

    if (text) {
      signIn(email, password)
        .then((error) => {
          setIsLoading(false)
          if (error) {
            setError(error)
          }
        })
    } else {
      signUp(email, password, confirmPassword)
        .then((error) => {
          setIsLoading(false)
          if (error) {
            setError(error)
          } else {
            // If signup successful, show name input
            console.log('Signup successful, showing name input')
            setShowNameInput(true)
          }
        })
    }
  }

  const handlePress = () => {
    setText((prev) => !prev)
    setError(null)
    setShowNameInput(false)
    // Reset form when switching between sign in/up
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
  }
    return (
      <KeyboardAvoidingView 
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ paddingTop: insets.top + 25, paddingBottom: insets.bottom + 10 }}
      >
        <View className='flex-1 justify-center items-center px-6'>
          {/* App Header */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-orange-500 rounded-3xl items-center justify-center mb-4 shadow-lg">
              <FontAwesome5 name="check-circle" size={40} color="white" />
            </View>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Habiyo
            </Text>
            <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your daily dose of discipline.
            </Text>
          </View>

          {/* Name Input Screen (shown after successful signup) */}
          {showNameInput ? (
            <View className={`w-full max-w-sm ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-3xl shadow-xl`}>
              <View className="items-center mb-6">
                <FontAwesome5 name="user-circle" size={60} color="#F97316" />
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-center mt-4 mb-2`}>
                  Welcome to Habito! 🎉
                </Text>
                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                  Let's personalize your experience
                </Text>
              </View>

              {/* Name Input */}
              <View className="mb-6">
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  What should we call you?
                </Text>
                <TextInput
                  className={`p-4 rounded-2xl border-2 text-base ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder='Enter your name'
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  autoCapitalize='words'
                  autoCorrect={false}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Error Message */}
              {error && (
                <Text className="text-red-500 text-sm mb-4 text-center">
                  {error}
                </Text>
              )}

              {/* Continue Button */}
              <TouchableOpacity 
                onPress={handleNameSubmit} 
                disabled={isLoading}
                className={`p-4 rounded-2xl mb-4 shadow-lg ${
                  isLoading ? 'bg-orange-300' : 'bg-orange-500'
                }`}
                style={{ 
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6
                }}
              >
                <Text className="text-white text-lg font-bold text-center">
                  {isLoading ? 'Setting up...' : "Let's Get Started!"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Auth Form */
            <View className={`w-full max-w-sm ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-3xl shadow-xl`}>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-center mb-6`}>
              {text ? 'Welcome Back!' : 'Create Account'}
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Email
              </Text>
              <TextInput
                className={`p-4 rounded-2xl border-2 text-base ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                placeholder='Enter your email'
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Password
              </Text>
              <TextInput
                className={`p-4 rounded-2xl border-2 text-base ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                placeholder='Enter your password'
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                secureTextEntry
                autoCapitalize='none'
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirm Password Input */}
            {text === false && (
              <View className="mb-4">
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Confirm Password
                </Text>
                <TextInput
                  className={`p-4 rounded-2xl border-2 text-base ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder='Confirm your password'
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  secureTextEntry
                  autoCapitalize='none'
                  autoCorrect={false}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            )}

            {/* Error Message */}
            {error && (
              <Text className="text-red-500 text-sm mb-4 text-center">
                {error}
              </Text>
            )}

            {/* Sign In/Up Button */}
            <TouchableOpacity 

              onPress={handleAuth} 
              disabled={isLoading}
              className={`p-4 rounded-2xl mb-4 shadow-lg ${
                isLoading ? 'bg-orange-300' : 'bg-orange-500'
              }`}
              style={{ 
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6
              }}
            >
              <Text className="text-white text-lg font-bold text-center">
                {isLoading ? 'Loading...' : text ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            {/* Google Sign In Button */}
            <TouchableOpacity 
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              className={`p-4 rounded-2xl border-2 ${
                isLoading 
                  ? 'opacity-50' 
                  : isDark 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-300 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-center">
                <FontAwesome5 name="google" size={18} color="#EA4335" />
                <Text className={`ml-3 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Sign in with Google
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          )}

          {/* Toggle Sign In/Up */}
          {!showNameInput && (
            <TouchableOpacity onPress={handlePress} className="mt-6">
              <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {text ? "Don't have an account? " : 'Already have an account? '}
                <Text className="text-orange-500 font-semibold">
                  {text ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    )
  }



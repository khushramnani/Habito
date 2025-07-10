import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { Button, TextInput, useTheme } from 'react-native-paper'
import { useAuth } from './context/authContext'

export default function Auth() {
  const [text, setText] = useState<Boolean>(true)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const theme = useTheme()

  const { signIn, signUp } = useAuth()

  const handleAuth = ()=>{
    if (text) {
      // Sign in
      if (!email || !password) {
        setError('Please fill in all fields')
        return
      }
      // Call signIn function
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
    if (text) {
      signIn(email, password)
        .then((error) => {
          if (error) {
            setError(error)
          }
        })
    } else {
      signUp(email, password, confirmPassword)
        .then((error) => {
          if (error) {
            setError(error)
          }
        })
    }
  }

  const handlePress = () => {
    setText((prev) => !prev)
  }
    return (
      <KeyboardAvoidingView className=' flex-1   bg-rose-500' behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
        <View className=' flex-1 justify-center items-center'>
          <Text className='text-white text-2xl font-bold'>Habit Tracker</Text>
          <View className='w-full max-w-lg flex flex-col gap-5  pt-8  p-6 rounded-lg shadow-lg'>
          <Text className='text-white text-xl font-bold pt-4 w-full text-center'>{text ? 'Welcome Back!' : 'Create Your Accout'}</Text>

            <TextInput
              label={'Email'}
              className=' p-4 bg-rose-100 rounded-md '
              placeholder='Email'
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              
            />
          <TextInput
            label={'Password'}
            className='bg-rose-100 p-4 rounded-md w-full '
            placeholder='Password'
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          {text === false && (
          <TextInput
            label={'Confirm Password'}
            className='bg-rose-100 p-4 rounded-md w-full '
            placeholder='Confirm Password'
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            
          />)}
          {error && <Text className={`${theme.colors.error} text-sm`}>{error}</Text>}

          <Button mode='contained' onPress={handleAuth} style={{ backgroundColor: theme.colors.scrim }} className='mt-4'>
            {text ? 'Sign In' : 'Sign Up'}
          </Button>
          </View>
          <Text onPress={handlePress} className='text-white text-sm mt-2'>{text ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}</Text>
        </View>
      </KeyboardAvoidingView>
    )
  }



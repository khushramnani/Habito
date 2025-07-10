import React from 'react';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/authContext';

const Login = () => {
  const { signOut } = useAuth();

  return (
    <View className='bg-orange-500 flex items-center justify-center h-full'>
        <Text className='text-white'> Login </Text>
        <Button onPress={signOut} >Sign Out</Button>
      </View>
    )
  }


export default Login

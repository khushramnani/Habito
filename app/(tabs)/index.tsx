import { Link } from "expo-router";
import { Text, View } from "react-native";
// import { StyleSheet } from "react-native";

export default function Index() {
  return (
    <View
    className="bg-black  flex items-center justify-center h-full">
      <Text className="text-white">Hello World</Text>
      <Link href="/Login" className="text-blue-500">
        Go to Login
      </Link>
    </View>
  );
}



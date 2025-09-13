import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/LoginScreen';
import FoldersScreen from '../screens/FoldersScreen';
import FolderDetailScreen from '../screens/FolderDetailScreen';
import DocumentScreen from '../screens/DocumentScreen';

export type RootStackParamList = {
  Login: undefined;
  Folders: undefined;
  FolderDetail: { folderId: string };
  Document: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Folders" component={FoldersScreen} options={{ title: '내 폴더' }} />
        <Stack.Screen name="FolderDetail" component={FolderDetailScreen} options={{ title: '폴더' }} />
        <Stack.Screen name="Document" component={DocumentScreen} options={{ title: '문서' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


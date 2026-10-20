import React, { useContext, useEffect, useState } from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';

import { LanguageProvider, LanguageContext } from './src/context/LanguageContext';
import DishListScreen from './src/screens/DishListScreen';
import DishDetailScreen from './src/screens/DishDetailScreen';
import DishFormScreen from './src/screens/DishFormScreen';
import { syncService } from './src/services/syncService';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { language, switchLanguage, t } = useContext(LanguageContext);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- LẮNG NGHE MẠNG VÀ TỰ ĐỘNG ĐỒNG BỘ ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
        // Nếu có mạng trở lại và chưa trong trạng thái đang đồng bộ
        if (state.isConnected && !isSyncing) {
            setIsSyncing(true);
            const result = await syncService.processQueue();
            if (result.count > 0) {
                Alert.alert('Auto Sync / Đồng bộ', `Đã tự động đẩy ${result.count} thao tác khi offline lên máy chủ!`);
            }
            setIsSyncing(false);
        }
    });
    return () => unsubscribe();
  }, [isSyncing]);

  const toggleLanguage = () => {
    switchLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <Stack.Navigator 
      initialRouteName="DishList"
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity 
            onPress={toggleLanguage} 
            style={{ padding: 6, backgroundColor: '#e0e0e0', borderRadius: 6, marginRight: 5 }}
          >
            <Text style={{ fontWeight: 'bold', color: '#333' }}>
              {language === 'en' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </Text>
          </TouchableOpacity>
        )
      }}
    >
      <Stack.Screen name="DishList" component={DishListScreen} options={{ title: `BIT240041 - ${t('appName')}` }} />
      <Stack.Screen name="DishDetail" component={DishDetailScreen} options={{ title: t('appName') }} />
      <Stack.Screen name="DishForm" component={DishFormScreen} options={{ title: t('appName') }} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </LanguageProvider>
  );
}
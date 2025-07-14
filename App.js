import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import LoginScreen from './CorpxBank/LoginScreen';
import RegisterScreen from './CorpxBank/RegisterScreen';
import CorpxWebViewScreen from './CorpxBank/CorpxWebViewScreen';
import ErrorBoundary from './CorpxBank/ErrorBoundary';

const SESSION_KEY = 'corpxbank_session';
const LOGIN_STATUS_KEY = 'corpxbank_logged';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);



  const checkAuthenticationStatus = async () => {
    try {
      console.log('🔍 Verificando status de autenticação...');

      // Verificar se já existe uma sessão válida
      const savedSession = await SecureStore.getItemAsync(SESSION_KEY);
      const loginStatus = await SecureStore.getItemAsync(LOGIN_STATUS_KEY);

      console.log('📊 Status encontrado:', { 
        hasSession: !!savedSession, 
        loginStatus: loginStatus 
      });

      if (savedSession && loginStatus === 'true') {
        // Verificar se a sessão ainda é válida
        try {
          const sessionData = JSON.parse(savedSession);
          const sessionAge = Date.now() - sessionData.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas

          if (sessionAge < maxAge) {
            console.log('✅ Sessão válida encontrada - redirecionando para WebView');
            setInitialRoute('WebView');
          } else {
            console.log('⏰ Sessão expirada - redirecionando para Login');
            // Limpar sessão expirada
            await Promise.all([
              SecureStore.deleteItemAsync(SESSION_KEY),
              SecureStore.deleteItemAsync(LOGIN_STATUS_KEY)
            ]);
            setInitialRoute('Login');
          }
        } catch (error) {
          console.error('❌ Erro ao validar sessão:', error);
          setInitialRoute('Login');
        }
      } else {
        console.log('🔑 Nenhuma sessão encontrada - redirecionando para Login');
        setInitialRoute('Login');
      }

    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      setInitialRoute('Login');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar tela de loading inicial
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E0E0E" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Inicializando Corpx Bank...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#0E0E0E" />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false, // Ocultar header de navegação
            gestureEnabled: false, // Desabilitar gestos de voltar
            animationEnabled: true, // Manter animações
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
          <Stack.Screen 
            name="WebView" 
            component={CorpxWebViewScreen}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});
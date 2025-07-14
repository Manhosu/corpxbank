import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const SESSION_KEY = 'corpxbank_session';
const LOGIN_STATUS_KEY = 'corpxbank_logged';
const BIOMETRIC_KEY = '@biometriaAtiva';
const LOGIN_KEY = '@login';
const PASSWORD_KEY = '@senha';

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [hasBiometricData, setHasBiometricData] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    checkSavedBiometricData();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Verificar se está rodando no Expo Go
      if (Constants.appOwnership === 'expo') {
        console.log('🔒 Biometria desabilitada no Expo Go');
        setBiometricSupported(false);
        return;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      setBiometricSupported(compatible && enrolled);
      console.log('🔒 Suporte biométrico:', { compatible, enrolled });
    } catch (error) {
      console.error('❌ Erro ao verificar biometria:', error);
      setBiometricSupported(false);
    }
  };

  const checkSavedBiometricData = async () => {
    try {
      const biometricActive = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      const savedLogin = await SecureStore.getItemAsync(LOGIN_KEY);
      const savedPassword = await SecureStore.getItemAsync(PASSWORD_KEY);
      
      setHasBiometricData(
        biometricActive === 'true' && 
        savedLogin && 
        savedPassword
      );
    } catch (error) {
      console.error('❌ Erro ao verificar dados biométricos:', error);
      setHasBiometricData(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use sua biometria para acessar o Corpx Bank',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        const savedLogin = await SecureStore.getItemAsync(LOGIN_KEY);
        const savedPassword = await SecureStore.getItemAsync(PASSWORD_KEY);
        
        if (savedLogin && savedPassword) {
          // Simular login automático
          await performAutomaticLogin(savedLogin, savedPassword);
        } else {
          Alert.alert('Erro', 'Dados de login não encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro na autenticação biométrica:', error);
      Alert.alert('Erro', 'Falha na autenticação biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const performAutomaticLogin = async (login, password) => {
    try {
      // Salvar sessão
      const sessionData = {
        timestamp: Date.now(),
        login: login,
      };
      
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sessionData));
      await SecureStore.setItemAsync(LOGIN_STATUS_KEY, 'true');
      
      console.log('✅ Login biométrico realizado com sucesso');
      navigation.replace('WebView');
    } catch (error) {
      console.error('❌ Erro no login automático:', error);
      Alert.alert('Erro', 'Falha no login automático');
    }
  };

  const handleManualLogin = () => {
    navigation.navigate('WebView', { 
      initialUrl: 'https://corpxbank.com.br/login.php',
      isLoginScreen: true 
    });
  };

  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Título */}
      <Text style={styles.title}>Bem-vindo ao Corpx Bank</Text>
      <Text style={styles.subtitle}>Escolha como deseja acessar sua conta</Text>

      {/* Botões */}
      <View style={styles.buttonsContainer}>
        {/* Botão Biometria */}
        {biometricSupported && hasBiometricData && (
          <TouchableOpacity
            style={[styles.button, styles.biometricButton]}
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.biometricIcon}>👆</Text>
                <Text style={styles.buttonText}>Entrar com Biometria</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Botão Login Manual */}
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleManualLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Entrar na minha conta</Text>
        </TouchableOpacity>

        {/* Botão Criar Conta */}
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={handleCreateAccount}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.registerButtonText]}>Criar conta</Text>
        </TouchableOpacity>
      </View>

      {/* Informações de teste */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>🧪 Dados de teste:</Text>
          <Text style={styles.debugText}>Login: valeria123</Text>
          <Text style={styles.debugText}>Senha: Valeria123</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  biometricButton: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#1976D2',
    borderColor: '#2196F3',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderColor: '#666666',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButtonText: {
    color: '#CCCCCC',
  },
  biometricIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#333333',
  },
  debugText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
});
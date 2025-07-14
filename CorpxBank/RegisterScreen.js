import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const handleGoToRegister = () => {
    navigation.navigate('WebView', { 
      initialUrl: 'https://corpxbank.com.br/cadastro.php',
      isSignupScreen: true 
    });
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
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
      <Text style={styles.title}>Criar sua conta</Text>
      <Text style={styles.subtitle}>
        Abra sua conta na Corpx Bank{"\n"}
        É rápido, fácil e 100% digital.
      </Text>

      {/* Botões */}
      <View style={styles.buttonsContainer}>
        {/* Botão Criar Conta */}
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={handleGoToRegister}
        >
          <Text style={styles.buttonText}>Começar cadastro</Text>
        </TouchableOpacity>

        {/* Botão Voltar */}
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBackToLogin}
        >
          <Text style={[styles.buttonText, styles.backButtonText]}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>

      {/* Informações */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>O que você precisa:</Text>
        <Text style={styles.infoText}>• Documento de identidade (RG ou CNH)</Text>
        <Text style={styles.infoText}>• Comprovante de residência</Text>
        <Text style={styles.infoText}>• Dados pessoais e de contato</Text>
        <Text style={styles.infoText}>• Para PJ: Contrato social</Text>
      </View>
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
    marginBottom: 30,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
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
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  registerButton: {
    backgroundColor: '#1976D2',
    borderColor: '#2196F3',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderColor: '#666666',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#CCCCCC',
  },
  infoContainer: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    maxWidth: 300,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
});
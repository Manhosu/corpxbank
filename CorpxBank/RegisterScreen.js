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
    navigation.navigate('Splash');
  };

  const handleBackToSplash = () => {
    navigation.navigate('Splash');
  };

  return (
    <View style={styles.container}>
      {/* Botão Voltar */}
      <TouchableOpacity
        style={styles.topBackButton}
        onPress={handleBackToSplash}
      >
        <Text style={styles.topBackButtonText}>← Voltar ao Login</Text>
      </TouchableOpacity>
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
          <Text style={[styles.buttonText, styles.backButtonText]}>← Voltar ao Login</Text>
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
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#E0E0E0',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backButtonText: {
    color: '#E0E0E0',
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  infoText: {
    color: '#D0D0D0',
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  topBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 1,
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  topBackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
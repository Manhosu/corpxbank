import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  BackHandler,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';

const SESSION_KEY = 'corpxbank_session';
const LOGIN_STATUS_KEY = 'corpxbank_logged';
const BIOMETRIC_KEY = 'biometriaAtiva';
const LOGIN_KEY = 'login';
const PASSWORD_KEY = 'senha';

export default function CorpxWebViewScreen({ navigation, route }) {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState(null);
  
  // Determinar URL inicial
  const initialUrl = route?.params?.initialUrl || 'https://corpxbank.com.br/inicial.php';
  const isLoginScreen = route?.params?.isLoginScreen || false;
  const isSignupScreen = route?.params?.isSignupScreen || false;

  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      } else {
        // Se não pode voltar na WebView, volta para a tela de login
        handleLogout();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState) => {
    setCurrentUrl(navState.url);
    setCanGoBack(navState.canGoBack);
    
    // Detectar login bem-sucedido
    if (navState.url.includes('inicial.php') && isLoginScreen) {
      handleSuccessfulLogin();
    }
  };

  const handleSuccessfulLogin = async () => {
    try {
      console.log('✅ Login detectado com sucesso');
      
      // Salvar sessão
      const sessionData = {
        timestamp: Date.now(),
        url: currentUrl,
      };
      
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sessionData));
      await SecureStore.setItemAsync(LOGIN_STATUS_KEY, 'true');
      
      // Verificar se deve mostrar prompt de biometria
      if (loginCredentials && Constants.appOwnership !== 'expo') {
        const biometricSupported = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const biometricActive = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        
        if (biometricSupported && enrolled && biometricActive !== 'true') {
          setShowBiometricPrompt(true);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
    }
  };

  const handleBiometricPrompt = async (enable) => {
    try {
      if (enable && loginCredentials) {
        // Salvar credenciais com biometria
        await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
        await SecureStore.setItemAsync(LOGIN_KEY, loginCredentials.login);
        await SecureStore.setItemAsync(PASSWORD_KEY, loginCredentials.password);
        
        Alert.alert(
          'Biometria Ativada',
          'Agora você pode fazer login usando sua biometria!'
        );
      } else {
        await SecureStore.setItemAsync(BIOMETRIC_KEY, 'false');
      }
    } catch (error) {
      console.error('❌ Erro ao configurar biometria:', error);
    } finally {
      setShowBiometricPrompt(false);
      setLoginCredentials(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Limpar sessão
      await Promise.all([
        SecureStore.deleteItemAsync(SESSION_KEY),
        SecureStore.deleteItemAsync(LOGIN_STATUS_KEY)
      ]);
      
      console.log('🔓 Logout realizado');
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      navigation.replace('Login');
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'LOGIN_CREDENTIALS':
          setLoginCredentials({
            login: data.login,
            password: data.password
          });
          // Mostrar prompt de biometria após capturar credenciais
          setTimeout(() => {
            setShowBiometricPrompt(true);
          }, 1000);
          break;
          
        case 'DOWNLOAD_FILE':
          handleFileDownload(data.url, data.filename);
          break;
          
        case 'LOGIN_SUCCESS':
          // Login bem-sucedido detectado
          if (loginCredentials) {
            setTimeout(() => {
              setShowBiometricPrompt(true);
            }, 1000);
          }
          break;
          
        case 'LOGOUT':
          handleLogout();
          break;
          
        default:
          console.log('📨 Mensagem recebida:', data);
      }
    } catch (error) {
      console.log('📨 Mensagem não-JSON recebida:', event.nativeEvent.data);
    }
  };

  const handleFileDownload = async (url, filename) => {
    try {
      console.log('📥 Iniciando download:', filename);
      
      // Verificar se é Expo Go
      const isExpoGo = __DEV__ && !Constants.isDevice;
      
      if (isExpoGo || Constants.appOwnership === 'expo') {
        Alert.alert(
          'Download não disponível', 
          'Downloads não funcionam no Expo Go. Use a versão standalone do app.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Para versão standalone
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'É necessário permitir acesso aos arquivos para fazer download.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const downloadResult = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + filename
      );
      
      if (downloadResult.status === 200) {
        // Salvar na galeria/downloads
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('CorpxBank', asset, false);
        
        Alert.alert(
          'Download concluído',
          `Arquivo ${filename} salvo com sucesso!`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Falha no download');
      }
    } catch (error) {
      console.error('❌ Erro no download:', error);
      Alert.alert(
        'Erro no download',
        'Não foi possível baixar o arquivo. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const injectedJavaScript = `
    (function() {
      try {
        // Verificar se ReactNativeWebView está disponível
        if (!window.ReactNativeWebView) {
          console.log('ReactNativeWebView não disponível');
          return true;
        }

        // Interceptar submissão de formulários de login
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          form.addEventListener('submit', function(e) {
            try {
              const loginField = form.querySelector('input[name="login"], input[name="email"], input[name="usuario"]');
              const passwordField = form.querySelector('input[name="senha"], input[name="password"]');
              
              if (loginField && passwordField && window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOGIN_CREDENTIALS',
                  login: loginField.value,
                  password: passwordField.value
                }));
                
                // Detectar redirecionamento após login (indicativo de sucesso)
                setTimeout(() => {
                  if (window.location.href !== window.location.href) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'LOGIN_SUCCESS'
                    }));
                  }
                }, 2000);
              }
            } catch (error) {
              console.error('Erro ao interceptar formulário:', error);
            }
        });
      });
      
        // Interceptar downloads - versão melhorada
        function setupDownloadInterceptors() {
          // Interceptar links de download existentes
          const downloadSelectors = [
            'a[href*=".pdf"]',
            'a[href*=".csv"]', 
            'a[href*="download"]',
            'a[download]',
            'button[onclick*="download"]',
            'button[onclick*="export"]',
            '[data-action="download"]',
            '[data-action="export"]'
          ];
          
          downloadSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.addEventListener('click', function(e) {
                try {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  let url = this.href || this.getAttribute('data-url');
                  let filename = this.getAttribute('download') || 
                               this.getAttribute('data-filename') || 
                               this.textContent.trim() || 
                               'arquivo';
                  
                  // Se não tem URL direta, tentar executar onclick primeiro
                  if (!url && this.onclick) {
                    // Executar a função original e aguardar
                    setTimeout(() => {
                      // Procurar por novos links de download que podem ter aparecido
                      const newLinks = document.querySelectorAll('a[href*="blob:"], a[href*="data:"]');
                      if (newLinks.length > 0) {
                        const lastLink = newLinks[newLinks.length - 1];
                        url = lastLink.href;
                        filename = lastLink.download || filename;
                      }
                      
                      if (url && window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'DOWNLOAD_FILE',
                          url: url,
                          filename: filename
                        }));
                      }
                    }, 500);
                    
                    // Executar função original
                    this.onclick.call(this, e);
                    return;
                  }
                  
                  if (url && window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'DOWNLOAD_FILE',
                      url: url,
                      filename: filename
                    }));
                  }
                } catch (error) {
                  console.error('Erro ao interceptar download:', error);
                }
              });
            });
          });
        }
        
        // Configurar interceptadores iniciais
        setupDownloadInterceptors();
        
        // Reconfigurar quando novos elementos forem adicionados
        const downloadObserver = new MutationObserver(() => {
          setupDownloadInterceptors();
        });
        
        downloadObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Interceptar logout
        const logoutLinks = document.querySelectorAll('a[href*="logout"], a[href*="sair"]');
        logoutLinks.forEach(link => {
          link.addEventListener('click', function(e) {
            try {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOGOUT'
                }));
              }
            } catch (error) {
              console.error('Erro ao interceptar logout:', error);
            }
          });
        });
        
        // Detectar mudanças na URL que indicam login bem-sucedido
        let currentUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            // Se saiu da página de login, provavelmente foi bem-sucedido
            if (!currentUrl.includes('login.php') && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOGIN_SUCCESS'
              }));
            }
          }
        });
        
        urlObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Melhorar UX mobile
        try {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport && document.head) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
          }
        } catch (error) {
          console.error('Erro ao configurar viewport:', error);
        }
        
      } catch (globalError) {
        console.error('Erro global no injectedJavaScript:', globalError);
      }
      
      return true; // Necessário para o injectedJavaScript
    })();
  `;

  const renderLoading = () => (
    <View style={styles.fullScreenLoadingContainer}>
      {/* Botão Logout na tela de loading */}
       <TouchableOpacity
         style={styles.loadingLogoutButton}
         onPress={handleBackToSplash}
       >
         <Text style={styles.logoutIcon}>✕</Text>
       </TouchableOpacity>
      
      <View style={styles.loadingContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>
          {isLoginScreen ? 'Carregando login...' :
           isSignupScreen ? 'Carregando cadastro...' :
           'Carregando Corpx Bank...'}
        </Text>
      </View>
    </View>
  );

  const renderBiometricPrompt = () => (
    <View style={styles.promptOverlay}>
      <View style={styles.promptContainer}>
        <Text style={styles.promptTitle}>Ativar Login Biométrico?</Text>
        <Text style={styles.promptText}>
          Deseja salvar seus dados de login e usar biometria nos próximos acessos?
        </Text>
        
        <View style={styles.promptButtons}>
          <TouchableOpacity
            style={[styles.promptButton, styles.promptButtonSecondary]}
            onPress={() => handleBiometricPrompt(false)}
          >
            <Text style={styles.promptButtonTextSecondary}>Não, obrigado</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.promptButton, styles.promptButtonPrimary]}
            onPress={() => handleBiometricPrompt(true)}
          >
            <Text style={styles.promptButtonText}>Sim, ativar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const handleBackToSplash = () => {
    navigation.replace('Splash');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E0E" />
      
      {/* Botão Logout - só aparece quando não está carregando */}
       {!isLoading && (
         <TouchableOpacity
           style={styles.logoutButton}
           onPress={handleBackToSplash}
         >
           <Text style={styles.logoutIcon}>✕</Text>
         </TouchableOpacity>
       )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={renderLoading}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="compatibility"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ Erro na WebView:', nativeEvent);
          
          // Tentar recarregar em caso de erro
          if (webViewRef.current) {
            setTimeout(() => {
              webViewRef.current.reload();
            }, 2000);
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ Erro HTTP na WebView:', nativeEvent);
        }}
        onRenderProcessGone={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ Processo WebView encerrado:', nativeEvent);
          
          // Recarregar WebView se o processo morrer
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        }}
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 CorpxBankApp/1.0"
        onShouldStartLoadWithRequest={(request) => {
          try {
            // Permitir todos os requests do domínio corpxbank.com.br
            const isAllowed = request.url.includes('corpxbank.com.br') || 
                             request.url.startsWith('data:') ||
                             request.url.startsWith('blob:') ||
                             request.url.startsWith('https://') ||
                             request.url.startsWith('http://');
            
            console.log('🌐 Request:', request.url, 'Permitido:', isAllowed);
            return isAllowed;
          } catch (error) {
            console.error('❌ Erro ao validar request:', error);
            return false;
          }
        }}
      />
      
      {showBiometricPrompt && renderBiometricPrompt()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0E0E0E',
    zIndex: 999,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogoutButton: {
     position: 'absolute',
     top: 50,
     right: 20,
     backgroundColor: 'rgba(220, 53, 69, 0.9)',
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1001,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 60,
  },
  loadingIndicator: {
    marginBottom: 10,
  },
  promptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  promptContainer: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  promptTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  promptText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  promptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promptButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  promptButtonPrimary: {
    backgroundColor: '#2E7D32',
  },
  promptButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  promptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  promptButtonTextSecondary: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
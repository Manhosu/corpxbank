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
  SafeAreaView,
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
      console.log('📨 Mensagem WebView recebida:', data);
      
      switch (data.type) {
        case 'LOGIN_CREDENTIALS':
          console.log('🔐 Credenciais de login capturadas');
          setLoginCredentials({
            login: data.login,
            password: data.password
          });
          // Mostrar prompt de biometria após capturar credenciais
          setTimeout(() => {
            setShowBiometricPrompt(true);
          }, 1000);
          break;
          
        case 'DOWNLOAD_BUTTON_CLICKED':
          console.log('🎯 Botão de download clicado:', {
            buttonText: data.buttonText,
            timestamp: data.timestamp
          });
          Alert.alert(
            'Download Detectado',
            `Botão "${data.buttonText}" foi clicado. Aguardando arquivo...`,
            [{ text: 'OK' }]
          );
          break;
          
        case 'DOWNLOAD_FILE':
          console.log('📥 Solicitação de download recebida:', {
            url: data.url,
            filename: data.filename
          });
          handleFileDownload(data.url, data.filename);
          break;
          
        case 'LOGIN_SUCCESS':
          console.log('✅ Login bem-sucedido detectado');
          // Login bem-sucedido detectado
          if (loginCredentials) {
            setTimeout(() => {
              setShowBiometricPrompt(true);
            }, 1000);
          }
          break;
          
        case 'LOGOUT':
          console.log('🔓 Logout solicitado');
          handleLogout();
          break;
          
        case 'TEST_RESULTS':
          console.log('🧪 Resultados do teste automático:', data);
          
          let detailsText = `Página: ${data.currentUrl}\n`;
          detailsText += `Elementos encontrados: ${data.totalElements}\n\n`;
          
          if (data.foundElements && data.foundElements.length > 0) {
            detailsText += 'Elementos detectados:\n';
            data.foundElements.slice(0, 5).forEach((el, index) => {
              detailsText += `${index + 1}. ${el.tagName}: "${el.text}"\n`;
            });
            if (data.foundElements.length > 5) {
              detailsText += `... e mais ${data.foundElements.length - 5} elementos\n`;
            }
          } else {
            detailsText += 'Nenhum elemento de exportação encontrado.\n';
          }
          
          Alert.alert(
            'Teste de Exportação',
            detailsText,
            [
              { text: 'Console', onPress: () => console.log('📊 Elementos completos:', data.foundElements) },
              { text: 'OK' }
            ]
          );
          break;
          
        default:
          console.log('📨 Mensagem recebida (tipo desconhecido):', data);
      }
    } catch (error) {
      console.log('📨 Mensagem não-JSON recebida:', event.nativeEvent.data);
    }
  };

  const handleFileDownload = async (url, filename) => {
    try {
      console.log('📥 Iniciando download:', filename, 'URL:', url);
      console.log('🔧 Constants.appOwnership:', Constants.appOwnership);
      console.log('🔧 __DEV__:', __DEV__);
      console.log('🔧 Constants.isDevice:', Constants.isDevice);
      
      console.log('✅ Prosseguindo com download - verificação Expo Go removida');
      
      // Para versão standalone - solicitar permissões
      console.log('🔐 Solicitando permissões do MediaLibrary...');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('🔐 Status da permissão:', status);
      
      if (status !== 'granted') {
        console.log('❌ Permissão negada pelo usuário');
        Alert.alert(
          'Permissão necessária',
          'É necessário permitir acesso aos arquivos para fazer download.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('✅ Permissões concedidas - iniciando download');
      
      // Limpar filename de caracteres inválidos
      const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const downloadPath = FileSystem.documentDirectory + cleanFilename;
      
      console.log('📂 Caminho de download:', downloadPath);
      
      let downloadResult;
      
      // Tratamento especial para URLs blob e data
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        console.log('🔗 URL especial detectada (blob/data), tratamento customizado');
        
        try {
          // Para data URIs, extrair dados base64
          if (url.startsWith('data:')) {
            console.log('📄 Processando data URI');
            const base64Data = url.split(',')[1];
            await FileSystem.writeAsStringAsync(downloadPath, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            downloadResult = { status: 200, uri: downloadPath };
          } else {
            // Para blob URLs, tentar download direto
            console.log('🔗 Tentando download de blob URL');
            downloadResult = await FileSystem.downloadAsync(url, downloadPath);
          }
        } catch (blobError) {
          console.log('⚠️ Falha no tratamento de URL especial:', blobError.message);
          // Fallback para download normal
          downloadResult = await FileSystem.downloadAsync(url, downloadPath);
        }
      } else {
        // Download normal para URLs HTTP/HTTPS
        console.log('🌐 Download normal de URL HTTP/HTTPS');
        downloadResult = await FileSystem.downloadAsync(url, downloadPath);
      }
      
      console.log('📊 Resultado do download:', downloadResult);
      
      if (downloadResult.status === 200) {
        console.log('✅ Download concluído - salvando na galeria');
        
        // Salvar na galeria/downloads
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        console.log('📱 Asset criado:', asset.id);
        
        await MediaLibrary.createAlbumAsync('CorpxBank', asset, false);
        console.log('📁 Álbum CorpxBank criado/atualizado');
        
        Alert.alert(
          'Download concluído',
          `Arquivo ${cleanFilename} salvo com sucesso na galeria!`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('❌ Status de download inválido:', downloadResult.status);
        throw new Error(`Falha no download - Status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('❌ Erro detalhado no download:', {
        message: error.message,
        stack: error.stack,
        url: url,
        filename: filename
      });
      
      Alert.alert(
        'Erro no download',
        `Não foi possível baixar o arquivo: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const injectedJavaScript = `
    (function() {
      try {
        console.log('🚀 CorpxBank WebView Script iniciado');
        
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
              }
            } catch (error) {
              console.error('Erro ao interceptar formulário:', error);
            }
          });
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
        setInterval(() => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            if (!currentUrl.includes('login.php') && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOGIN_SUCCESS'
              }));
            }
          }
        }, 1000);
        
        // Interceptação robusta de downloads
        function setupDownloadInterceptors() {
          console.log('🔧 Configurando interceptadores de download');
          
          // Interceptar cliques em elementos de download
          document.addEventListener('click', function(e) {
            const target = e.target;
            let shouldIntercept = false;
            let url = '';
            let filename = 'arquivo';
            
            console.log('🖱️ Clique detectado em:', target.tagName, target.textContent || target.value || '', target.className);
            
            // Verificar se é um link de download
            if (target.tagName === 'A') {
              console.log('🔗 Link detectado:', target.href);
              if (target.href && (target.href.includes('.pdf') || target.href.includes('.csv') || target.download)) {
                shouldIntercept = true;
                url = target.href;
                filename = target.download || target.textContent.trim() || 'arquivo';
                console.log('✅ Link de download identificado:', url, filename);
              }
            }
            
            // Verificar se é um botão com onclick que pode gerar download
            if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.type === 'submit') {
              const text = target.textContent || target.value || '';
              const onclick = target.getAttribute('onclick') || '';
              const className = target.className || '';
              
              console.log('🔘 Botão/Input detectado:', {
                text: text,
                onclick: onclick,
                className: className,
                type: target.type
              });
              
              if (text.toLowerCase().includes('exportar') || 
                  text.toLowerCase().includes('download') ||
                  text.toLowerCase().includes('pdf') ||
                  text.toLowerCase().includes('csv') ||
                  text.toLowerCase().includes('gerar') ||
                  text.toLowerCase().includes('relatório') ||
                  text.toLowerCase().includes('relatorio') ||
                  onclick.includes('export') ||
                  onclick.includes('download') ||
                  onclick.includes('pdf') ||
                  onclick.includes('csv') ||
                  className.includes('export') ||
                  className.includes('download')) {
                
                console.log('🎯 Botão de download detectado:', text);
                
                // Enviar mensagem imediatamente para notificar o clique
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'DOWNLOAD_BUTTON_CLICKED',
                    buttonText: text,
                    timestamp: Date.now()
                  }));
                }
                
                // Monitorar por novos links criados dinamicamente
                const checkForDownloads = () => {
                  const newLinks = document.querySelectorAll('a[href*="blob:"], a[href*="data:"], a[download]');
                  console.log('🔍 Verificando novos links de download:', newLinks.length);
                  
                  if (newLinks.length > 0) {
                    const lastLink = newLinks[newLinks.length - 1];
                    console.log('📎 Novo link encontrado:', lastLink.href);
                    
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DOWNLOAD_FILE',
                        url: lastLink.href,
                        filename: lastLink.download || text || 'arquivo'
                      }));
                    }
                  }
                  
                  // Verificar também por mudanças no window.location
                  if (window.location.href.includes('download') || window.location.href.includes('export')) {
                    console.log('🌐 URL de download detectada:', window.location.href);
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DOWNLOAD_FILE',
                        url: window.location.href,
                        filename: text || 'arquivo'
                      }));
                    }
                  }
                };
                
                // Verificar múltiplas vezes com intervalos diferentes
                setTimeout(checkForDownloads, 500);
                setTimeout(checkForDownloads, 1000);
                setTimeout(checkForDownloads, 2000);
                setTimeout(checkForDownloads, 3000);
                setTimeout(checkForDownloads, 5000);
              }
            }
            
            if (shouldIntercept && window.ReactNativeWebView) {
              console.log('📥 Download interceptado:', url, filename);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'DOWNLOAD_FILE',
                url: url,
                filename: filename
              }));
            }
          });
        }
        
        // Configurar interceptadores
        setupDownloadInterceptors();
        
        // Interceptar criação de novos elementos (especialmente links de download)
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                  // Verificar se é um link de download
                  if (node.tagName === 'A' && (node.href.includes('blob:') || node.href.includes('data:') || node.download)) {
                    console.log('🆕 Novo link de download criado:', node.href);
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DOWNLOAD_FILE',
                        url: node.href,
                        filename: node.download || node.textContent || 'arquivo'
                      }));
                    }
                  }
                  
                  // Verificar links dentro do novo elemento
                  const newLinks = node.querySelectorAll ? node.querySelectorAll('a[href*="blob:"], a[href*="data:"], a[download]') : [];
                  if (newLinks.length > 0) {
                    console.log('🔗 Novos links encontrados em elemento adicionado:', newLinks.length);
                    newLinks.forEach(link => {
                      console.log('📎 Link encontrado:', link.href);
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'DOWNLOAD_FILE',
                          url: link.href,
                          filename: link.download || link.textContent || 'arquivo'
                        }));
                      }
                    });
                  }
                }
              });
            }
          });
          
          // Reconfigurar interceptadores para novos elementos
          setupDownloadInterceptors();
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['href', 'download']
        });
        
        // Interceptar mudanças na URL que podem indicar downloads
        let lastUrl = window.location.href;
        setInterval(() => {
          if (window.location.href !== lastUrl) {
            console.log('🌐 URL mudou:', window.location.href);
            if (window.location.href.includes('download') || window.location.href.includes('export') || window.location.href.includes('blob:') || window.location.href.includes('data:')) {
              console.log('📥 URL de download detectada:', window.location.href);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'DOWNLOAD_FILE',
                  url: window.location.href,
                  filename: 'arquivo_exportado'
                }));
              }
            }
            lastUrl = window.location.href;
          }
        }, 500);
        
      } catch (error) {
        console.error('Erro no script:', error);
      }
      
      return true;
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E0E" translucent={false} />
      
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
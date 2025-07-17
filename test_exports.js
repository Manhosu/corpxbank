/**
 * Script de Teste para Funcionalidades de Exportação
 * CorpxBank - Teste de Downloads PDF/CSV
 */

const testExportFunctionality = () => {
  console.log('🧪 Iniciando bateria de testes de exportação...');
  
  // Teste 1: Verificar se os seletores estão funcionando
  const testSelectors = [
    'a[href*=".pdf"]',
    'a[href*=".csv"]',
    'a[href*="download"]',
    'a[download]',
    'button[onclick*="download"]',
    'button[onclick*="export"]',
    'button[onclick*="pdf"]',
    'button[onclick*="csv"]',
    '[data-action="download"]',
    '[data-action="export"]',
    'input[type="submit"][value*="export"]',
    'input[type="button"][value*="export"]',
    '.btn-download',
    '.download-btn',
    '.export-btn'
  ];
  
  console.log('📋 Testando seletores de download...');
  testSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ ${selector}: ${elements.length} elementos encontrados`);
      elements.forEach((el, index) => {
        console.log(`  - Elemento ${index + 1}: ${el.tagName} - ${el.textContent?.trim() || el.value || 'sem texto'}`);
      });
    } else {
      console.log(`⚪ ${selector}: nenhum elemento encontrado`);
    }
  });
  
  // Teste 2: Simular cliques em botões de exportação
  console.log('\n🖱️ Testando interceptação de cliques...');
  
  const downloadButtons = document.querySelectorAll(
    'button[onclick*="download"], button[onclick*="export"], .btn-download, .download-btn, .export-btn'
  );
  
  if (downloadButtons.length > 0) {
    console.log(`📊 Encontrados ${downloadButtons.length} botões de download/export`);
    
    downloadButtons.forEach((button, index) => {
      console.log(`🔍 Botão ${index + 1}:`, {
        tagName: button.tagName,
        className: button.className,
        textContent: button.textContent?.trim(),
        onclick: button.onclick ? 'presente' : 'ausente',
        onclickAttr: button.getAttribute('onclick') ? 'presente' : 'ausente'
      });
    });
  } else {
    console.log('⚠️ Nenhum botão de download/export encontrado na página atual');
  }
  
  // Teste 3: Verificar formulários de exportação
  console.log('\n📋 Testando formulários de exportação...');
  
  const forms = document.querySelectorAll('form');
  const exportForms = Array.from(forms).filter(form => {
    const action = form.action || '';
    return action.includes('export') || action.includes('download') || 
           action.includes('pdf') || action.includes('csv');
  });
  
  if (exportForms.length > 0) {
    console.log(`📝 Encontrados ${exportForms.length} formulários de exportação`);
    exportForms.forEach((form, index) => {
      console.log(`  - Formulário ${index + 1}: action="${form.action}", method="${form.method}"`);
    });
  } else {
    console.log('⚪ Nenhum formulário de exportação encontrado');
  }
  
  // Teste 4: Verificar se ReactNativeWebView está disponível
  console.log('\n🔗 Testando comunicação com app nativo...');
  
  if (window.ReactNativeWebView) {
    console.log('✅ ReactNativeWebView disponível');
    
    // Teste de envio de mensagem
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'TEST_MESSAGE',
        message: 'Teste de comunicação WebView -> App'
      }));
      console.log('✅ Mensagem de teste enviada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de teste:', error);
    }
  } else {
    console.log('❌ ReactNativeWebView não disponível (normal em navegador)');
  }
  
  // Teste 5: Simular download de teste
  console.log('\n📥 Testando simulação de download...');
  
  const testDownload = () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DOWNLOAD_FILE',
        url: 'data:text/plain;base64,VGVzdGUgZGUgZG93bmxvYWQ=',
        filename: 'teste.txt'
      }));
      console.log('✅ Download de teste simulado');
    } else {
      console.log('⚠️ Simulação de download não disponível (ReactNativeWebView ausente)');
    }
  };
  
  testDownload();
  
  console.log('\n🏁 Bateria de testes concluída!');
  console.log('📊 Verifique os logs acima para identificar problemas');
  
  return {
    selectorsFound: testSelectors.map(sel => ({
      selector: sel,
      count: document.querySelectorAll(sel).length
    })),
    downloadButtons: downloadButtons.length,
    exportForms: exportForms.length,
    reactNativeWebView: !!window.ReactNativeWebView
  };
};

// Executar testes automaticamente quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testExportFunctionality);
} else {
  testExportFunctionality();
}

// Disponibilizar função globalmente para teste manual
window.testExportFunctionality = testExportFunctionality;

console.log('🧪 Script de teste carregado. Execute testExportFunctionality() para testar manualmente.');
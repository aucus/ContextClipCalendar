// ContextClipCalendar Options Script
document.addEventListener('DOMContentLoaded', () => {
    console.log('ContextClipCalendar options page loaded');
    // Apply i18n translations
    applyI18n();
    initializeOptionsPage();
});

// Apply i18n translations to elements with data-i18n attribute
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            // Handle title element
            if (element.tagName === 'TITLE') {
                document.title = message;
            } else if (message.includes('<a ') || message.includes('<strong>')) {
                // For elements with HTML content (links, bold text), use innerHTML
                element.innerHTML = message;
            } else if (element.innerHTML.includes('<br>') || element.innerHTML.includes('<strong>') || element.innerHTML.includes('<small>')) {
                // For elements with HTML content, we need to preserve structure
                // This is handled by individual elements
                element.textContent = message;
            } else {
                element.textContent = message;
            }
        }
    });
}

// DOM elements
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const geminiStatus = document.getElementById('geminiStatus');
const geminiStatusIcon = document.getElementById('geminiStatusIcon');
const geminiStatusText = document.getElementById('geminiStatusText');
const testGeminiBtn = document.getElementById('testGeminiBtn');
const saveGeminiBtn = document.getElementById('saveGeminiBtn');

// AI Model Selection
const selectedLLMRadios = document.querySelectorAll('input[name="selectedLLM"]');
const geminiApiGroup = document.getElementById('geminiApiGroup');
const claudeApiGroup = document.getElementById('claudeApiGroup');
const chatgptApiGroup = document.getElementById('chatgptApiGroup');

// Claude API elements
const claudeApiKeyInput = document.getElementById('claudeApiKey');
const claudeStatus = document.getElementById('claudeStatus');
const claudeStatusIcon = document.getElementById('claudeStatusIcon');
const claudeStatusText = document.getElementById('claudeStatusText');
const testClaudeBtn = document.getElementById('testClaudeBtn');

// ChatGPT API elements
const chatgptApiKeyInput = document.getElementById('chatgptApiKey');
const chatgptStatus = document.getElementById('chatgptStatus');
const chatgptStatusIcon = document.getElementById('chatgptStatusIcon');
const chatgptStatusText = document.getElementById('chatgptStatusText');
const testChatgptBtn = document.getElementById('testChatgptBtn');

// Save button
const saveApiKeysBtn = document.getElementById('saveApiKeysBtn');

// Guide tabs
const guideTabs = document.querySelectorAll('.guide-tab');
const guideContents = document.querySelectorAll('.guide-content');
const googleStatus = document.getElementById('googleStatus');
const authenticateGoogleBtn = document.getElementById('authenticateGoogleBtn');
const revokeGoogleBtn = document.getElementById('revokeGoogleBtn');

// Authenticate with Google
async function authenticateGoogle() {
    try {
        console.log('Starting Google authentication...');
        
        // Disable button and show loading
        authenticateGoogleBtn.disabled = true;
        authenticateGoogleBtn.innerHTML = `
            <div class="spinner"></div>
            ${chrome.i18n.getMessage('authenticating')}
        `;
        
        showGoogleStatus('warning', chrome.i18n.getMessage('authenticating'));
        
        const response = await chrome.runtime.sendMessage({
            action: 'authenticateGoogle'
        });
        
        console.log('Google authentication response:', response);
        
        if (response.success) {
            showGoogleStatus('success', chrome.i18n.getMessage('googleCalendarIntegration') + ' is enabled');
            authenticateGoogleBtn.classList.add('hidden');
            revokeGoogleBtn.classList.remove('hidden');
        } else {
            showGoogleStatus('error', response.error || chrome.i18n.getMessage('authenticating') + ' failed');
        }
        
    } catch (error) {
        console.error('Google authentication error:', error);
        showGoogleStatus('error', 'An error occurred during authentication');
    } finally {
        // Restore button
        authenticateGoogleBtn.disabled = false;
        authenticateGoogleBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            ${chrome.i18n.getMessage('authenticateGoogle')}
        `;
    }
}

// Revoke Google authentication
async function revokeGoogleAuth() {
    if (!confirm('Google 인증을 해제하시겠습니까?\n해제 후에는 일정 등록 기능을 사용할 수 없습니다.')) {
        return;
    }
    
    try {
        console.log('Revoking Google authentication...');
        
        // Disable button and show loading
        revokeGoogleBtn.disabled = true;
        revokeGoogleBtn.innerHTML = `
            <div class="spinner"></div>
            ${chrome.i18n.getMessage('revoking')}
        `;
        
        showGoogleStatus('warning', chrome.i18n.getMessage('revoking'));
        
        const response = await chrome.runtime.sendMessage({
            action: 'revokeGoogleAuth'
        });
        
        console.log('Google revoke response:', response);
        
        if (response.success) {
            showGoogleStatus('error', 'Authentication revoked');
            authenticateGoogleBtn.classList.remove('hidden');
            revokeGoogleBtn.classList.add('hidden');
        } else {
            showGoogleStatus('error', response.error || 'Failed to revoke authentication');
        }
        
    } catch (error) {
        console.error('Google revoke error:', error);
        showGoogleStatus('error', 'An error occurred while revoking authentication');
    } finally {
        // Restore button
        revokeGoogleBtn.disabled = false;
        revokeGoogleBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364"></path>
            </svg>
            ${chrome.i18n.getMessage('revokeAuth')}
        `;
    }
}

// Initialize options page
async function initializeOptionsPage() {
    await loadSettings();
    await checkGoogleAuthStatus();
    setupEventListeners();
}

// Load existing settings
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'selectedLLM',
            'geminiApiKey',
            'claudeApiKey',
            'chatgptApiKey'
        ]);
        
        console.log('Loaded settings:', settings);
        
        // Load AI model selection
        if (settings.selectedLLM) {
            const selectedRadio = document.querySelector(`input[name="selectedLLM"][value="${settings.selectedLLM}"]`);
            if (selectedRadio) {
                selectedRadio.checked = true;
                updateAPIKeyVisibility(settings.selectedLLM);
            }
        }
        
        // Load API keys
        if (settings.geminiApiKey) {
            geminiApiKeyInput.value = settings.geminiApiKey;
            showGeminiStatus('success', 'Saved API key found');
        }
        if (settings.claudeApiKey) {
            claudeApiKeyInput.value = settings.claudeApiKey;
            showClaudeStatus('success', '저장된 API 키가 있습니다');
        }
        if (settings.chatgptApiKey) {
            chatgptApiKeyInput.value = settings.chatgptApiKey;
            showChatgptStatus('success', '저장된 API 키가 있습니다');
        }
        
    } catch (error) {
        console.error('Settings loading error:', error);
        showGeminiStatus('error', 'Error loading settings');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Gemini API key input
    geminiApiKeyInput.addEventListener('input', () => {
        hideGeminiStatus();
    });
    
    // Claude API key input
    claudeApiKeyInput.addEventListener('input', () => {
        hideClaudeStatus();
    });
    
    // ChatGPT API key input
    chatgptApiKeyInput.addEventListener('input', () => {
        hideChatgptStatus();
    });
    
    // Test API buttons
    testGeminiBtn.addEventListener('click', testGeminiAPI);
    testClaudeBtn.addEventListener('click', testClaudeAPI);
    testChatgptBtn.addEventListener('click', testChatgptAPI);
    
    // Save all API keys button
    saveApiKeysBtn.addEventListener('click', saveAllAPIKeys);
    
    // Google authentication button
    authenticateGoogleBtn.addEventListener('click', authenticateGoogle);
    
    // Revoke Google authentication button
    revokeGoogleBtn.addEventListener('click', revokeGoogleAuth);
    
    // Enter key support for API key input
    geminiApiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveGeminiSettings();
        }
    });
}

// Test Gemini API
async function testGeminiAPI() {
    const apiKey = geminiApiKeyInput.value.trim();
    
    if (!apiKey) {
        showGeminiStatus('error', 'Please enter API key');
        return;
    }
    
    try {
        // Disable button and show loading
        testGeminiBtn.disabled = true;
        testGeminiBtn.innerHTML = `
            <div class="spinner"></div>
            ${chrome.i18n.getMessage('test')}...
        `;
        
        showGeminiStatus('warning', 'Testing API key...');
        
        // Test API key through background script
        const response = await chrome.runtime.sendMessage({
            action: 'testGeminiAPI',
            apiKey: apiKey
        });
        
        console.log('Gemini API test response:', response);
        
        if (response.success) {
            showGeminiStatus('success', response.message || 'API key is valid');
        } else {
            showGeminiStatus('error', response.error || 'API key test failed');
        }
        
    } catch (error) {
        console.error('Gemini API test error:', error);
        showGeminiStatus('error', 'Error during test');
    } finally {
        // Restore button
        testGeminiBtn.disabled = false;
        testGeminiBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            API 키 테스트
        `;
    }
}

// Save Gemini settings
async function saveGeminiSettings() {
    const apiKey = geminiApiKeyInput.value.trim();
    
    if (!apiKey) {
        showGeminiStatus('error', 'Please enter API key');
        return;
    }
    
    try {
        // Disable button and show loading
        saveGeminiBtn.disabled = true;
        saveGeminiBtn.innerHTML = `
            <div class="spinner"></div>
            저장 중...
        `;
        
        // Save settings through background script
        const response = await chrome.runtime.sendMessage({
            action: 'saveSettings',
            settings: {
                geminiApiKey: apiKey
            }
        });
        
        console.log('Save settings response:', response);
        
        if (response.success) {
            showGeminiStatus('success', 'API 키가 저장되었습니다');
            
            // Auto-test after saving
            setTimeout(testGeminiAPI, 1000);
        } else {
            showGeminiStatus('error', response.error || '저장 중 오류가 발생했습니다');
        }
        
    } catch (error) {
        console.error('Save settings error:', error);
        showGeminiStatus('error', '저장 중 오류가 발생했습니다');
    } finally {
        // Restore button
        saveGeminiBtn.disabled = false;
        saveGeminiBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            저장
        `;
    }
}

// Show Gemini status
function showGeminiStatus(type, message) {
    const iconMap = {
        success: `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `,
        error: `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `,
        warning: `
            <div class="spinner"></div>
        `
    };
    
    geminiStatusIcon.innerHTML = iconMap[type] || iconMap.warning;
    geminiStatusText.textContent = message;
    
    // Remove all status classes and add current one
    geminiStatus.className = `status-indicator status-${type} fade-in`;
    geminiStatus.classList.remove('hidden');
}

// Hide Gemini status
function hideGeminiStatus() {
    geminiStatus.classList.add('hidden');
}

// Check Google authentication status
async function checkGoogleAuthStatus() {
    try {
        console.log('Checking Google auth status...');
        
        // First check Chrome Web Store OAuth status
        const oauthStatus = await chrome.runtime.sendMessage({
            action: 'checkChromeStoreOAuthStatus'
        });
        
        console.log('Chrome Web Store OAuth status:', oauthStatus);
        
        if (oauthStatus.success && oauthStatus.hasToken) {
            // Chrome Web Store OAuth is working
            showGoogleStatus('success', oauthStatus.message);
            if (authenticateGoogleBtn) authenticateGoogleBtn.classList.add('hidden');
            if (revokeGoogleBtn) revokeGoogleBtn.classList.remove('hidden');
            return;
        }
        
        // Check if we have a stored access token
        const { googleAccessToken } = await chrome.storage.local.get(['googleAccessToken']);
        
        if (googleAccessToken) {
            // We have a stored token, show success status
            showGoogleStatus('success', chrome.i18n.getMessage('googleCalendarIntegration') + ' is enabled');
            
            // Hide OAuth buttons since we're already authenticated
            if (authenticateGoogleBtn) authenticateGoogleBtn.classList.add('hidden');
            if (revokeGoogleBtn) revokeGoogleBtn.classList.remove('hidden');
        } else {
            // No token and Chrome Web Store OAuth not ready
            if (oauthStatus.code === 'CHROME_STORE_OAUTH_PENDING') {
                showGoogleStatus('warning', oauthStatus.message);
            } else {
                showGoogleStatus('info', 'Google Calendar 연동을 위해 OAuth 인증이 필요합니다');
            }
            
            // Show OAuth buttons for manual authentication
            if (authenticateGoogleBtn) authenticateGoogleBtn.classList.remove('hidden');
            if (revokeGoogleBtn) revokeGoogleBtn.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Google auth status check error:', error);
        showGoogleStatus('error', 'Error checking OAuth status');
    }
}

// Setup AI model selection
function setupAIModelSelection() {
    selectedLLMRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                updateAPIKeyVisibility(e.target.value);
            }
        });
    });
}

// Update API key visibility based on selected model
function updateAPIKeyVisibility(selectedModel) {
    // Hide all API groups
    geminiApiGroup.classList.add('hidden');
    claudeApiGroup.classList.add('hidden');
    chatgptApiGroup.classList.add('hidden');
    
    // Show selected API group
    switch (selectedModel) {
        case 'gemini':
            geminiApiGroup.classList.remove('hidden');
            break;
        case 'claude':
            claudeApiGroup.classList.remove('hidden');
            break;
        case 'chatgpt':
            chatgptApiGroup.classList.remove('hidden');
            break;
    }
}

// Setup guide tabs
function setupGuideTabs() {
    guideTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            guideTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            guideContents.forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${tabName}Guide`).classList.remove('hidden');
        });
    });
}

// Test Claude API
async function testClaudeAPI() {
    const apiKey = claudeApiKeyInput.value.trim();
    
    if (!apiKey) {
        showClaudeStatus('error', 'Please enter API key');
        return;
    }
    
    try {
        showClaudeStatus('warning', 'Testing API key...');
        testClaudeBtn.disabled = true;
        
        const response = await chrome.runtime.sendMessage({
            action: 'testClaudeAPI',
            apiKey: apiKey
        });
        
        if (response.success) {
            showClaudeStatus('success', 'Claude API key is valid!');
        } else {
            showClaudeStatus('error', response.error || 'API key test failed');
        }
        
    } catch (error) {
        console.error('Claude API test error:', error);
        showClaudeStatus('error', 'Error during test');
    } finally {
        testClaudeBtn.disabled = false;
    }
}

// Test ChatGPT API
async function testChatgptAPI() {
    const apiKey = chatgptApiKeyInput.value.trim();
    
    if (!apiKey) {
        showChatgptStatus('error', 'Please enter API key');
        return;
    }
    
    try {
        showChatgptStatus('warning', 'Testing API key...');
        testChatgptBtn.disabled = true;
        
        const response = await chrome.runtime.sendMessage({
            action: 'testChatgptAPI',
            apiKey: apiKey
        });
        
        if (response.success) {
            showChatgptStatus('success', 'ChatGPT API key is valid!');
        } else {
            showChatgptStatus('error', response.error || 'API key test failed');
        }
        
    } catch (error) {
        console.error('ChatGPT API test error:', error);
        showChatgptStatus('error', 'Error during test');
    } finally {
        testChatgptBtn.disabled = false;
    }
}

// Save all API keys
async function saveAllAPIKeys() {
    try {
        const selectedLLM = document.querySelector('input[name="selectedLLM"]:checked').value;
        const geminiApiKey = geminiApiKeyInput.value.trim();
        const claudeApiKey = claudeApiKeyInput.value.trim();
        const chatgptApiKey = chatgptApiKeyInput.value.trim();
        
        const settings = {
            selectedLLM,
            geminiApiKey,
            claudeApiKey,
            chatgptApiKey
        };
        
        await chrome.storage.local.set(settings);
        
        // Show success message
        showGeminiStatus('success', 'All settings saved!');
        
        console.log('Settings saved:', settings);
        
    } catch (error) {
        console.error('Save settings error:', error);
        showGeminiStatus('error', 'Error saving settings');
    }
}

// Show Claude status
function showClaudeStatus(type, message) {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    claudeStatusIcon.textContent = icon;
    claudeStatusText.textContent = message;
    claudeStatus.className = `status-indicator ${type}`;
    claudeStatus.classList.remove('hidden');
}

// Hide Claude status
function hideClaudeStatus() {
    claudeStatus.classList.add('hidden');
}

// Show ChatGPT status
function showChatgptStatus(type, message) {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    chatgptStatusIcon.textContent = icon;
    chatgptStatusText.textContent = message;
    chatgptStatus.className = `status-indicator ${type}`;
    chatgptStatus.classList.remove('hidden');
}

// Hide ChatGPT status
function hideChatgptStatus() {
    chatgptStatus.classList.add('hidden');
}

// Show Google status
function showGoogleStatus(type, message) {
    const iconMap = {
        success: `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `,
        error: `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `,
        warning: `
            <div class="spinner"></div>
        `
    };
    
    googleStatus.innerHTML = `
        ${iconMap[type] || iconMap.warning}
        <span>${message}</span>
    `;
    
    // Remove all status classes and add current one
    googleStatus.className = `status-indicator status-${type} fade-in`;
}
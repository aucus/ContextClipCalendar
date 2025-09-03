// ContextClipCalendar Options Script
document.addEventListener('DOMContentLoaded', () => {
    console.log('ContextClipCalendar options page loaded');
    initializeOptionsPage();
});

// DOM elements
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const geminiStatus = document.getElementById('geminiStatus');
const geminiStatusIcon = document.getElementById('geminiStatusIcon');
const geminiStatusText = document.getElementById('geminiStatusText');
const testGeminiBtn = document.getElementById('testGeminiBtn');
const saveGeminiBtn = document.getElementById('saveGeminiBtn');
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
            인증 중...
        `;
        
        showGoogleStatus('warning', 'Google 계정 인증을 진행하고 있습니다...');
        
        const response = await chrome.runtime.sendMessage({
            action: 'authenticateGoogle'
        });
        
        console.log('Google authentication response:', response);
        
        if (response.success) {
            showGoogleStatus('success', '인증 완료! Google Calendar 연동이 활성화되었습니다');
            authenticateGoogleBtn.classList.add('hidden');
            revokeGoogleBtn.classList.remove('hidden');
        } else {
            showGoogleStatus('error', response.error || '인증에 실패했습니다');
        }
        
    } catch (error) {
        console.error('Google authentication error:', error);
        showGoogleStatus('error', '인증 중 오류가 발생했습니다');
    } finally {
        // Restore button
        authenticateGoogleBtn.disabled = false;
        authenticateGoogleBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            Google 계정 인증
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
            해제 중...
        `;
        
        showGoogleStatus('warning', '인증을 해제하고 있습니다...');
        
        const response = await chrome.runtime.sendMessage({
            action: 'revokeGoogleAuth'
        });
        
        console.log('Google revoke response:', response);
        
        if (response.success) {
            showGoogleStatus('error', '인증이 해제되었습니다');
            authenticateGoogleBtn.classList.remove('hidden');
            revokeGoogleBtn.classList.add('hidden');
        } else {
            showGoogleStatus('error', response.error || '인증 해제에 실패했습니다');
        }
        
    } catch (error) {
        console.error('Google revoke error:', error);
        showGoogleStatus('error', '인증 해제 중 오류가 발생했습니다');
    } finally {
        // Restore button
        revokeGoogleBtn.disabled = false;
        revokeGoogleBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364"></path>
            </svg>
            인증 해제
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
            'geminiApiKey'
        ]);
        
        console.log('Loaded settings:', settings);
        
        // Load Gemini API key
        if (settings.geminiApiKey) {
            geminiApiKeyInput.value = settings.geminiApiKey;
            showGeminiStatus('success', '저장된 API 키가 있습니다');
        }
        
    } catch (error) {
        console.error('Settings loading error:', error);
        showGeminiStatus('error', '설정을 불러오는 중 오류가 발생했습니다');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Gemini API key input
    geminiApiKeyInput.addEventListener('input', () => {
        hideGeminiStatus();
    });
    
    // Test Gemini API button
    testGeminiBtn.addEventListener('click', testGeminiAPI);
    
    // Save Gemini API button
    saveGeminiBtn.addEventListener('click', saveGeminiSettings);
    
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
        showGeminiStatus('error', 'API 키를 입력해주세요');
        return;
    }
    
    try {
        // Disable button and show loading
        testGeminiBtn.disabled = true;
        testGeminiBtn.innerHTML = `
            <div class="spinner"></div>
            테스트 중...
        `;
        
        showGeminiStatus('warning', 'API 키를 테스트하고 있습니다...');
        
        // Test API key through background script
        const response = await chrome.runtime.sendMessage({
            action: 'testGeminiAPI',
            apiKey: apiKey
        });
        
        console.log('Gemini API test response:', response);
        
        if (response.success) {
            showGeminiStatus('success', response.message || 'API 키가 유효합니다');
        } else {
            showGeminiStatus('error', response.error || 'API 키 테스트에 실패했습니다');
        }
        
    } catch (error) {
        console.error('Gemini API test error:', error);
        showGeminiStatus('error', '테스트 중 오류가 발생했습니다');
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
        showGeminiStatus('error', 'API 키를 입력해주세요');
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
            showGoogleStatus('success', 'Google Calendar 연동이 활성화되었습니다');
            
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
        showGoogleStatus('error', 'OAuth 상태 확인 중 오류가 발생했습니다');
    }
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
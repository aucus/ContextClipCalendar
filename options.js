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
    
    // Note: OAuth event listeners removed - Chrome Web Store will handle OAuth automatically
    
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
        
        // Show Chrome Web Store OAuth status
        showGoogleStatus('success', 'Chrome Web Store에서 자동으로 OAuth를 처리합니다');
        
        // Hide OAuth buttons since Chrome Web Store handles this automatically
        if (authenticateGoogleBtn) authenticateGoogleBtn.classList.add('hidden');
        if (revokeGoogleBtn) revokeGoogleBtn.classList.add('hidden');
        
    } catch (error) {
        console.error('Google auth status check error:', error);
        showGoogleStatus('info', 'Chrome Web Store OAuth 설정 중...');
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
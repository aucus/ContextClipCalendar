// ContextClipCalendar Popup Script
// DOM elements
const selectedTextContainer = document.getElementById('selectedTextContainer');
const selectedText = document.getElementById('selectedText');
const textSource = document.getElementById('textSource');
const noTextState = document.getElementById('noTextState');
const actionButtons = document.getElementById('actionButtons');
const loadingState = document.getElementById('loadingState');
const successMessage = document.getElementById('successMessage');
const successDesc = document.getElementById('successDesc');
const successDetails = document.getElementById('successDetails');
const successActions = document.getElementById('successActions');
const calendarBtn = document.getElementById('calendarBtn');
const settingsBtn = document.getElementById('settingsBtn');
const clipboardBtn = document.getElementById('clipboardBtn');

// Currently selected text and source
let currentSelectedText = '';
let currentTextSource = ''; // 'selection' or 'clipboard'

// Popup initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ContextClipCalendar popup initialization');
    await initializePopup();
    setupEventListeners();
});

// Check clipboard permission
async function checkClipboardPermission() {
    try {
        // Check permission status
        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });
        console.log('Clipboard permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
            return true;
        } else if (permissionStatus.state === 'prompt') {
            // Request permission
            try {
                await navigator.clipboard.readText();
                return true;
            } catch (error) {
                console.log('Clipboard permission request failed:', error);
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.log('Error checking permission:', error);
        return false;
    }
}

// Popup initialization function (clipboard-centric)
async function initializePopup() {
    try {
        console.log('Starting popup initialization');
        
        // Check clipboard permission
        const hasPermission = await checkClipboardPermission();
        if (!hasPermission) {
            showPermissionRequiredState();
            return;
        }
        
        // Automatically try to get text from clipboard
        await readFromClipboard();
        
    } catch (error) {
        console.error('Popup initialization error:', error);
        showNoTextState();
    }
}

// Show permission required state
function showPermissionRequiredState() {
    selectedTextContainer.classList.add('hidden');
    actionButtons.classList.add('hidden');
    textSource.classList.add('hidden');
    noTextState.classList.remove('hidden');
    noTextState.classList.add('fade-in');
    
    // Add permission request button
    noTextState.innerHTML = `
        <div class="text-center">
            <div class="no-text-icon">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
            </div>
            <h3 class="no-text-title">클립보드 접근 권한 필요</h3>
            <p class="no-text-desc">클립보드에서 텍스트를 읽기 위해<br>권한이 필요합니다.</p>
            <button id="requestPermissionBtn" class="btn primary-btn">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                권한 허용
            </button>
        </div>
    `;
    
    // Add event listener for permission request button
    document.getElementById('requestPermissionBtn').addEventListener('click', handlePermissionRequest);
}

// Handle permission request
async function handlePermissionRequest() {
    try {
        console.log('Requesting clipboard permission...');
        
        // Try to read clipboard to trigger permission request
        const text = await navigator.clipboard.readText();
        console.log('Permission granted, clipboard text length:', text.length);
        
        // Update UI to show the text
        showSelectedText(text, 'clipboard');
        
    } catch (error) {
        console.error('Permission request failed:', error);
        
        // Show error message
        noTextState.innerHTML = `
            <div class="text-center">
                <div class="no-text-icon">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="no-text-title">권한 거부됨</h3>
                <p class="no-text-desc">클립보드 접근이 거부되었습니다.<br>브라우저 설정에서 클립보드 권한을 허용해주세요.</p>
                <button id="retryPermissionBtn" class="btn primary-btn">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    다시 시도
                </button>
            </div>
        `;
        
        document.getElementById('retryPermissionBtn').addEventListener('click', handlePermissionRequest);
    }
}

// Read from clipboard
async function readFromClipboard() {
    try {
        console.log('Reading from clipboard...');
        
        // Reset clipboard button state
        resetClipboardButton();
        
        const text = await navigator.clipboard.readText();
        console.log('Clipboard text length:', text.length);
        
        if (text && text.trim()) {
            showSelectedText(text, 'clipboard');
        } else {
            console.log('Clipboard is empty or contains only whitespace');
            showNoTextState();
        }
        
    } catch (error) {
        console.error('Error reading clipboard:', error);
        showNoTextState();
    }
}

// Reset clipboard button
function resetClipboardButton() {
    if (clipboardBtn) {
        clipboardBtn.disabled = true;
        clipboardBtn.innerHTML = `
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>읽는 중...</span>
        `;
    }
}

// Show selected text
function showSelectedText(text, source) {
    console.log('Showing selected text, source:', source);
    
    currentSelectedText = text;
    currentTextSource = source;
    
    selectedText.textContent = text;
    textSource.textContent = source === 'clipboard' ? '클립보드에서 가져옴' : '선택된 텍스트';
    textSource.className = `text-source ${source}`;
    
    selectedTextContainer.classList.remove('hidden');
    actionButtons.classList.remove('hidden');
    noTextState.classList.add('hidden');
    
    // Reset clipboard button
    if (clipboardBtn) {
        clipboardBtn.disabled = false;
        clipboardBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span>📋 클립보드에서 가져오기</span>
        `;
    }
}

// Show no text state
function showNoTextState() {
    selectedTextContainer.classList.add('hidden');
    actionButtons.classList.add('hidden');
    noTextState.classList.remove('hidden');
    noTextState.classList.add('fade-in');
    
    // Reset to original no-text state
    noTextState.innerHTML = `
        <div class="no-text-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
        </div>
        <h3 class="no-text-title">📋 클립보드에서 일정 텍스트 가져오기</h3>
        <p class="no-text-desc">일정으로 등록할 텍스트를 복사한 후<br>아래 버튼을 클릭하여 가져오세요</p>
        
        <!-- Clipboard text import button -->
        <button id="clipboardBtn" class="clipboard-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span>📋 클립보드에서 가져오기</span>
        </button>
    `;
    
    // Re-attach clipboard button event listener
    const newClipboardBtn = document.getElementById('clipboardBtn');
    if (newClipboardBtn) {
        newClipboardBtn.addEventListener('click', readFromClipboard);
    }
}

// Show loading
function showLoading() {
    selectedTextContainer.classList.add('hidden');
    actionButtons.classList.add('hidden');
    noTextState.classList.add('hidden');
    loadingState.classList.remove('hidden');
}

// Hide loading
function hideLoading() {
    loadingState.classList.add('hidden');
}

// Show success message
function showSuccessMessage(message, data = null) {
    hideLoading();
    
    successDesc.textContent = message;
    
    if (data) {
        // Create details HTML
        let detailsHTML = '';
        
        if (data.summary) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">제목:</span>
                    <span class="detail-value">${data.summary}</span>
                </div>
            `;
        }
        
        if (data.startTime) {
            const startDate = new Date(data.startTime);
            const formattedDate = startDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            const formattedTime = startDate.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">날짜:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">시간:</span>
                    <span class="detail-value">${formattedTime}</span>
                </div>
            `;
        }
        
        if (data.location) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">장소:</span>
                    <span class="detail-value">${data.location}</span>
                </div>
            `;
        }
        
        successDetails.innerHTML = detailsHTML;
        
        // Create action buttons
        let actionsHTML = '';
        
        if (data.htmlLink) {
            actionsHTML += `
                <button class="action-btn primary-btn" id="viewCalendarBtn" data-link="${data.htmlLink}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    캘린더에서 보기
                </button>
            `;
        }
        
        actionsHTML += `
            <button class="action-btn secondary-btn" id="newScheduleBtn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                새 일정 등록
            </button>
        `;
        
        successActions.innerHTML = actionsHTML;
        
        // Add event listeners to success action buttons
        setupSuccessActionListeners();
    }
    
    successMessage.classList.remove('hidden');
    successMessage.classList.add('fade-in');
}

// Setup success action button listeners
function setupSuccessActionListeners() {
    // View calendar button
    const viewCalendarBtn = document.getElementById('viewCalendarBtn');
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', () => {
            const link = viewCalendarBtn.getAttribute('data-link');
            if (link) {
                openCalendarEvent(link);
            }
        });
    }
    
    // New schedule button
    const newScheduleBtn = document.getElementById('newScheduleBtn');
    if (newScheduleBtn) {
        newScheduleBtn.addEventListener('click', resetPopup);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Clipboard button
    if (clipboardBtn) {
        clipboardBtn.addEventListener('click', readFromClipboard);
    }
    
    // Calendar button
    if (calendarBtn) {
        calendarBtn.addEventListener('click', handleCalendarAction);
    }
    
    // Settings button
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }
}

// Handle calendar action
async function handleCalendarAction() {
    if (!currentSelectedText) {
        console.error('No text selected for calendar action');
        return;
    }
    
    try {
        console.log('Starting calendar action with text:', currentSelectedText.substring(0, 100) + '...');
        
        showLoading();
        
        // Send message to background script
        const response = await chrome.runtime.sendMessage({
            action: 'createCalendarEvent',
            text: currentSelectedText,
            source: currentTextSource
        });
        
        console.log('Calendar action response:', response);
        
        if (response.success) {
            showSuccessMessage('일정이 성공적으로 등록되었습니다!', response.data);
        } else {
            console.error('Calendar action failed:', response.error);
            if (response.error === 'extract_failed') {
                showExtractFailedDialog(response.message || '일정 정보를 추출할 수 없습니다', response.details);
            } else {
                showExtractFailedDialog(response.error || '일정 처리 중 오류가 발생했습니다');
            }
        }
        
    } catch (error) {
        console.error('Calendar action error:', error);
        hideLoading();
        showError('일정 처리 중 오류가 발생했습니다');
    }
}

// Show extract failed dialog
function showExtractFailedDialog(message, details) {
    hideLoading();
    
    // Create dialog HTML
    const dialogHTML = `
        <div id="extract-failed-dialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" style="background: white; border-radius: 0.75rem; padding: 1.5rem; max-width: 24rem; width: 100%; margin: 0 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                <div class="flex items-center mb-4" style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <svg class="w-6 h-6 text-red-500 mr-3" style="width: 1.5rem; height: 1.5rem; color: #ef4444; margin-right: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900" style="font-size: 1.125rem; font-weight: 600; color: #111827;">추출 실패</h3>
                </div>
                <p class="text-gray-600 mb-4" style="color: #4b5563; margin-bottom: 1rem; line-height: 1.5;">${message}</p>
                ${details ? `<p class="text-sm text-gray-500 mb-4" style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem; line-height: 1.5;">${details}</p>` : ''}
                <div class="flex justify-end space-x-3" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                    <button id="retryBtn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
                        다시 시도
                    </button>
                    <button id="closeDialogBtn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" style="padding: 0.5rem 1rem; background: #d1d5db; color: #374151; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add dialog to body
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // Add event listeners
    document.getElementById('retryBtn').addEventListener('click', () => {
        document.getElementById('extract-failed-dialog').remove();
        handleCalendarAction();
    });
    
    document.getElementById('closeDialogBtn').addEventListener('click', () => {
        document.getElementById('extract-failed-dialog').remove();
    });
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            const dialog = document.getElementById('extract-failed-dialog');
            if (dialog) {
                dialog.remove();
            }
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Show success notification
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error notification
function showError(message) {
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast transform opacity-0`;
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        z-index: 50;
        transition: all 0.2s ease-in-out;
        transform: translateY(8px);
        opacity: 0;
        max-width: 20rem;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = '#10b981';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.background = '#ef4444';
        notification.style.color = 'white';
    } else {
        notification.style.background = '#3b82f6';
        notification.style.color = 'white';
    }
    
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(8px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 200);
    }, 3000);
}

// Open calendar event
function openCalendarEvent(htmlLink) {
    chrome.tabs.create({ url: htmlLink });
}

// Reset popup
function resetPopup() {
    successMessage.classList.add('hidden');
    showNoTextState();
}

// Global functions for success message buttons
window.openCalendarEvent = openCalendarEvent;
window.resetPopup = resetPopup;
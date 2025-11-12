// ContextClipCalendar Content Script
// This script runs on all web pages to enable context menu functionality

console.log('ContextClipCalendar content script loaded');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    switch (request.action) {
        case 'getSelectedText':
            const selectedText = window.getSelection().toString().trim();
            sendResponse({ selectedText });
            break;
            
        case 'showNotification':
            showNotification(request.message, request.type || 'info');
            sendResponse({ success: true });
            break;
            
        case 'highlightText':
            highlightSelectedText();
            sendResponse({ success: true });
            break;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
    
    return true; // Keep the message channel open for async responses
});

// Show notification on the page
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.contextclip-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'contextclip-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 320px;
        word-wrap: break-word;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    // Set colors based on type
    let backgroundColor, textColor, iconSvg;
    
    switch (type) {
        case 'success':
            backgroundColor = '#10b981';
            textColor = 'white';
            iconSvg = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
            break;
        case 'error':
            backgroundColor = '#ef4444';
            textColor = 'white';
            iconSvg = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
            break;
        case 'warning':
            backgroundColor = '#f59e0b';
            textColor = 'white';
            iconSvg = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            `;
            break;
        default:
            backgroundColor = '#3b82f6';
            textColor = 'white';
            iconSvg = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
    }
    
    notification.style.backgroundColor = backgroundColor;
    notification.style.color = textColor;
    
    // Add icon and message
    notification.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Highlight selected text temporarily
function highlightSelectedText() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) return;
    
    // Create highlight element
    const highlight = document.createElement('span');
    highlight.style.cssText = `
        background: rgba(16, 185, 129, 0.2);
        border-radius: 4px;
        padding: 2px 4px;
        transition: all 0.3s ease;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    `;
    
    try {
        // Wrap the selected text with highlight
        range.surroundContents(highlight);
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            if (highlight.parentNode) {
                const parent = highlight.parentNode;
                parent.replaceChild(document.createTextNode(selectedText), highlight);
                parent.normalize(); // Merge adjacent text nodes
            }
        }, 2000);
        
        // Clear selection
        selection.removeAllRanges();
        
    } catch (error) {
        console.log('Could not highlight selection:', error);
        // Fallback: just clear selection
        selection.removeAllRanges();
    }
}

// Enhanced text selection detection for better context menu positioning
let lastSelectedText = '';
let selectionTimeout = null;

document.addEventListener('selectionchange', () => {
    // Clear previous timeout
    if (selectionTimeout) {
        clearTimeout(selectionTimeout);
    }
    
    // Debounce selection changes
    selectionTimeout = setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText && selectedText !== lastSelectedText) {
            lastSelectedText = selectedText;
            console.log('New text selected:', selectedText.substring(0, 50) + '...');
            
            // Send selection info to background script (for potential future features)
            chrome.runtime.sendMessage({
                action: 'textSelected',
                text: selectedText,
                url: window.location.href,
                timestamp: Date.now()
            }).catch(error => {
                // Ignore errors if background script is not ready
                console.log('Could not send selection to background script:', error);
            });
        } else if (!selectedText) {
            lastSelectedText = '';
        }
    }, 100);
});

// Keyboard shortcut support (optional enhancement)
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+C (or Cmd+Shift+C on Mac) to quickly register selected text
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText) {
            event.preventDefault();
            
            // Send to background script for processing
            chrome.runtime.sendMessage({
                action: 'createCalendarEvent',
                text: selectedText,
                source: 'keyboard_shortcut'
            }).then(response => {
                if (response && response.success) {
                    showNotification(chrome.i18n.getMessage('scheduleSuccessfullyRegistered'), 'success');
                    highlightSelectedText();
                } else {
                    showNotification(response?.error || chrome.i18n.getMessage('errorRegisteringSchedule'), 'error');
                }
            }).catch(error => {
                console.error('Keyboard shortcut calendar action error:', error);
                showNotification(chrome.i18n.getMessage('errorRegisteringSchedule'), 'error');
            });
        } else {
            showNotification(chrome.i18n.getMessage('pleaseSelectTextFirst'), 'warning');
        }
    }
});

// Page load optimization: inject CSS only when needed
function injectNotificationStyles() {
    if (document.getElementById('contextclip-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'contextclip-styles';
    styles.textContent = `
        .contextclip-notification {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Roboto, sans-serif !important;
        }
        
        .contextclip-notification svg {
            flex-shrink: 0;
        }
        
        /* Ensure notifications appear above all content */
        .contextclip-notification {
            z-index: 2147483647 !important;
        }
    `;
    
    document.head.appendChild(styles);
}

// Initialize styles when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNotificationStyles);
} else {
    injectNotificationStyles();
}

console.log('ContextClipCalendar content script initialized successfully');
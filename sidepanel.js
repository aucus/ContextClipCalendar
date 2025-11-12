// ContextClipCalendar Side Panel Script
// Handles event editing and calendar integration

// DOM elements
const loadingState = document.getElementById('loadingState');
const mainContainer = document.getElementById('mainContainer');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const multiEventTabs = document.getElementById('multiEventTabs');

// Form elements
const eventTitle = document.getElementById('eventTitle');
const eventDescription = document.getElementById('eventDescription');
const allDayCheckbox = document.getElementById('allDay');
const startDateTime = document.getElementById('startDateTime');
const endDateTime = document.getElementById('endDateTime');
const recurrence = document.getElementById('recurrence');
const eventLocation = document.getElementById('eventLocation');
const attendeeInput = document.getElementById('attendeeInput');
const attendeeList = document.getElementById('attendeeList');
const reminder = document.getElementById('reminder');

// Buttons
const closeBtn = document.getElementById('closeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

// State
let currentEvents = [];
let currentEventIndex = 0;
let isEditing = false;
let isSaving = false; // Prevent multiple saves

// Initialize side panel
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ContextClipCalendar side panel initialization');
    // Apply i18n translations
    applyI18n();
    await initializeSidePanel();
    setupEventListeners();
});

// Apply i18n translations to elements with data-i18n attribute
function applyI18n() {
    // Translate title
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
        const key = titleElement.getAttribute('data-i18n');
        document.title = chrome.i18n.getMessage(key) + ' - ContextClipCalendar';
    }
    
    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            if (element.tagName === 'TITLE') {
                // Already handled above
            } else {
                element.textContent = message;
            }
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.placeholder = message;
        }
    });
    
    // Translate reminder options with minutes
    document.querySelectorAll('[data-i18n-minutes]').forEach(element => {
        const minutes = element.getAttribute('data-i18n-minutes');
        const message = chrome.i18n.getMessage('minutesBefore', [minutes]);
        if (message) {
            element.textContent = message;
        }
    });
    
    // Translate select options
    const recurrenceSelect = document.getElementById('recurrence');
    if (recurrenceSelect) {
        Array.from(recurrenceSelect.options).forEach(option => {
            if (option.hasAttribute('data-i18n')) {
                const key = option.getAttribute('data-i18n');
                const message = chrome.i18n.getMessage(key);
                if (message) {
                    option.textContent = message;
                }
            }
        });
    }
    
    const reminderSelect = document.getElementById('reminder');
    if (reminderSelect) {
        Array.from(reminderSelect.options).forEach(option => {
            if (option.hasAttribute('data-i18n')) {
                const key = option.getAttribute('data-i18n');
                const message = chrome.i18n.getMessage(key);
                if (message) {
                    option.textContent = message;
                }
            }
        });
    }
}

// Initialize side panel
async function initializeSidePanel() {
    try {
        // Show loading state
        showLoading();
        
        // Check for pending data from background script
        await checkForPendingData();
        
    } catch (error) {
        console.error('Side panel initialization error:', error);
        showError('An error occurred while initializing the side panel.');
    }
}

// Check for pending data from background script
async function checkForPendingData() {
    try {
        const result = await chrome.storage.local.get(['pendingSidePanelData', 'pendingSidePanelTimestamp']);
        
        if (result.pendingSidePanelData && result.pendingSidePanelTimestamp) {
            // Check if data is recent (within last 30 seconds)
            const now = Date.now();
            const dataAge = now - result.pendingSidePanelTimestamp;
            
            if (dataAge < 30000) { // 30 seconds
                console.log('Found pending data:', result.pendingSidePanelData);
                
                // Clear the pending data
                await chrome.storage.local.remove(['pendingSidePanelData', 'pendingSidePanelTimestamp']);
                
                // Load the data
                if (Array.isArray(result.pendingSidePanelData)) {
                    handleLoadMultipleEvents(result.pendingSidePanelData);
                } else {
                    handleLoadEventData(result.pendingSidePanelData);
                }
                
                // Notify popup that data has been received (optional)
                try {
                    chrome.runtime.sendMessage({
                        action: 'sidePanelDataReceived'
                    });
                } catch (error) {
                    // Ignore if popup is already closed
                    console.log('Popup may already be closed');
                }
                return;
            }
        }
        
        // No pending data, show default form
        console.log('No pending data found, showing default form');
        hideLoading();
        
    } catch (error) {
        console.error('Error checking for pending data:', error);
        hideLoading();
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('=== SIDEPANEL.JS: Setting up event listeners ===');
    
    // Close button
    closeBtn.addEventListener('click', closeSidePanel);
    
    // Cancel button
    cancelBtn.addEventListener('click', closeSidePanel);
    
    // Save button
    console.log('=== SIDEPANEL.JS: Adding click listener to save button ===');
    saveBtn.addEventListener('click', () => {
        console.log('=== SIDEPANEL.JS: Save button clicked ===');
        handleSave();
    });
    
    // All day checkbox
    allDayCheckbox.addEventListener('change', handleAllDayChange);
    
    // Attendee input
    attendeeInput.addEventListener('keypress', handleAttendeeKeypress);
    
    // Start date change
    startDateTime.addEventListener('change', handleStartDateChange);
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request, sender, sendResponse);
        return true; // Keep message channel open for async response
    });
}

// Handle messages from background script
function handleMessage(request, sender, sendResponse) {
    console.log('Side panel received message:', request);
    
        switch (request.action) {
            case 'loadEventData':
                if (Array.isArray(request.data)) {
                    handleLoadMultipleEvents(request.data);
                } else {
                    handleLoadEventData(request.data);
                }
                break;
            case 'loadMultipleEvents':
                handleLoadMultipleEvents(request.data);
                break;
            default:
                console.log('Unknown message action:', request.action);
        }
}

// Handle single event data
function handleLoadEventData(eventData) {
    console.log('Loading single event data:', eventData);
    
    currentEvents = [eventData];
    currentEventIndex = 0;
    loadEventIntoForm(eventData);
    hideLoading();
}

// Handle multiple events data
function handleLoadMultipleEvents(eventsData) {
    console.log('Loading multiple events data:', eventsData);
    
    currentEvents = eventsData;
    currentEventIndex = 0;
    
    if (eventsData.length > 1) {
        showMultiEventTabs(eventsData);
    }
    
    loadEventIntoForm(eventsData[0]);
    hideLoading();
}

// Show multi-event tabs
function showMultiEventTabs(events) {
    multiEventTabs.classList.add('show');
    
    const tabsContainer = multiEventTabs;
    tabsContainer.innerHTML = '';
    
    events.forEach((event, index) => {
        const tab = document.createElement('div');
        tab.className = `event-tab ${index === 0 ? 'active' : ''}`;
        tab.innerHTML = `
            <div class="event-tab-title">${event.title || chrome.i18n.getMessage('noTitle')}</div>
            <div class="event-tab-time">${formatEventTime(event)}</div>
        `;
        
        tab.addEventListener('click', () => {
            switchToEvent(index);
        });
        
        tabsContainer.appendChild(tab);
    });
}

// Switch to specific event
function switchToEvent(index) {
    currentEventIndex = index;
    
    // Update tab states
    document.querySelectorAll('.event-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // Load event into form
    loadEventIntoForm(currentEvents[index]);
}

// Load event data into form
function loadEventIntoForm(eventData) {
    console.log('Loading event into form:', eventData);
    
    // Basic information
    eventTitle.value = eventData.title || '';
    eventDescription.value = eventData.description || '';
    
    // Date and time
    if (eventData.startDate) {
        const startDate = new Date(eventData.startDate);
        startDateTime.value = formatDateTimeLocal(startDate);
    }
    
    if (eventData.endDate) {
        const endDate = new Date(eventData.endDate);
        endDateTime.value = formatDateTimeLocal(endDate);
    }
    
    // All day check
    allDayCheckbox.checked = eventData.allDay || false;
    handleAllDayChange();
    
    // Location
    eventLocation.value = eventData.location || '';
    
    // Attendees
    clearAttendees();
    if (eventData.attendees && Array.isArray(eventData.attendees)) {
        eventData.attendees.forEach(attendee => {
            addAttendee(attendee);
        });
    }
    
    // Reminder
    if (eventData.reminder) {
        const reminderMinutes = parseReminder(eventData.reminder);
        reminder.value = reminderMinutes;
    }
    
    isEditing = true;
}

// Handle all day checkbox change
function handleAllDayChange() {
    if (allDayCheckbox.checked) {
        // For all day events, set time to 00:00
        const startDate = new Date(startDateTime.value);
        const endDate = new Date(endDateTime.value);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        startDateTime.value = formatDateTimeLocal(startDate);
        endDateTime.value = formatDateTimeLocal(endDate);
    }
}

// Handle start date change
function handleStartDateChange() {
    if (!endDateTime.value) {
        // If no end date, set it to 1 hour after start
        const startDate = new Date(startDateTime.value);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        endDateTime.value = formatDateTimeLocal(endDate);
    }
}

// Handle attendee input keypress
function handleAttendeeKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const email = attendeeInput.value.trim();
        if (email && isValidEmail(email)) {
            addAttendee(email);
            attendeeInput.value = '';
        } else {
            showError(chrome.i18n.getMessage('enterValidEmail'));
        }
    }
}

// Add attendee
function addAttendee(email) {
    const attendeeTag = document.createElement('div');
    attendeeTag.className = 'attendee-tag';
    attendeeTag.innerHTML = `
        ${email}
        <button class="attendee-remove" onclick="removeAttendee(this)">×</button>
    `;
    attendeeList.appendChild(attendeeTag);
}

// Remove attendee
function removeAttendee(button) {
    button.parentElement.remove();
}

// Clear all attendees
function clearAttendees() {
    attendeeList.innerHTML = '';
}

// Get current attendees
function getCurrentAttendees() {
    const attendees = [];
    document.querySelectorAll('.attendee-tag').forEach(tag => {
        const email = tag.textContent.replace('×', '').trim();
        if (email) {
            attendees.push(email);
        }
    });
    return attendees;
}

// Handle save
async function handleSave() {
    console.log('=== SIDEPANEL.JS: handleSave called ===');
    console.log('handleSave called, isSaving:', isSaving);
    
    if (isSaving) {
        console.log('Save in progress, ignoring multiple clicks.');
        return;
    }

    isSaving = true;
    console.log('Setting isSaving to true');
    
    try {
        console.log('Saving event...');
        
        // Validate form
        if (!eventTitle.value.trim()) {
            showError(chrome.i18n.getMessage('enterEventTitle'));
            return;
        }
        
        if (!startDateTime.value || !endDateTime.value) {
            showError(chrome.i18n.getMessage('enterStartEndTime'));
            return;
        }
        
        const startDate = new Date(startDateTime.value);
        const endDate = new Date(endDateTime.value);
        
        if (endDate <= startDate) {
            showError(chrome.i18n.getMessage('endTimeAfterStart'));
            return;
        }
        
        // Prepare event data
        const eventData = {
            title: eventTitle.value.trim(),
            description: eventDescription.value.trim(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            allDay: allDayCheckbox.checked,
            location: eventLocation.value.trim(),
            attendees: getCurrentAttendees(),
            reminder: reminder.value,
            recurrence: recurrence.value
        };
        
        console.log('Saving event data:', eventData);
        
        // Show loading
        saveBtn.disabled = true;
        saveBtn.textContent = chrome.i18n.getMessage('saving');
        
        // Send to background script for calendar creation
        const response = await chrome.runtime.sendMessage({
            action: 'createCalendarEvent',
            eventData: eventData
        });
        
        if (response.success) {
            // Show success message in statusMessage area
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.innerHTML = '<div style="margin-bottom: 1rem; color: #166534; font-weight: 500;">' + chrome.i18n.getMessage('scheduleSuccessfullyRegistered') + '</div>';
                statusMessage.classList.remove('hidden');
                statusMessage.classList.add('success');
            }
            
            // Store Google Calendar event data
            if (response.data && response.data.eventId) {
                if (currentEvents[currentEventIndex]) {
                    currentEvents[currentEventIndex].eventId = response.data.eventId;
                    currentEvents[currentEventIndex].htmlLink = response.data.htmlLink;
                    console.log('Stored event ID:', response.data.eventId);
                }
            }
            
            // Transform save button to Google Calendar button
            console.log('About to call transformSaveButtonToCalendarButton');
            
            // Direct button transformation
            const saveBtn = document.getElementById('saveBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            
            if (saveBtn) {
                console.log('=== SIDEPANEL.JS: Replacing save button with calendar button ===');
                
                // Remove the old button completely
                const buttonContainer = saveBtn.parentNode;
                saveBtn.remove();
                
                // Create new calendar button
                const newCalendarBtn = document.createElement('button');
                newCalendarBtn.id = 'saveBtn'; // Keep same ID for consistency
                newCalendarBtn.textContent = '📅 ' + chrome.i18n.getMessage('goToCalendar');
                newCalendarBtn.className = 'btn btn-primary';
                newCalendarBtn.style.cssText = `
                    background: linear-gradient(135deg, #4285f4, #34a853);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                `;
                
                // Add click event for Google Calendar (only once)
                newCalendarBtn.addEventListener('click', () => {
                    console.log('=== SIDEPANEL.JS: Calendar button clicked ===');
                    const currentEvent = currentEvents[currentEventIndex];
                    const eventId = currentEvent?.eventId;
                    const htmlLink = currentEvent?.htmlLink;
                    
                    if (htmlLink) {
                        chrome.tabs.create({ url: htmlLink });
                        console.log('Opening event using HTML link:', htmlLink);
                    } else if (eventId) {
                        const eventUrl = `https://calendar.google.com/calendar/u/0/event?eid=${eventId}`;
                        chrome.tabs.create({ url: eventUrl });
                        console.log('Opening specific event:', eventUrl);
                    } else {
                        chrome.tabs.create({ url: 'https://calendar.google.com/calendar/u/0/r' });
                        console.log('Opening general Google Calendar (no event data)');
                    }
                    
                    // Close side panel after opening Google Calendar
                    setTimeout(() => {
                        closeSidePanel();
                    }, 500);
                });
                
                // Add hover effects
                newCalendarBtn.addEventListener('mouseenter', () => {
                    newCalendarBtn.style.transform = 'translateY(-2px)';
                    newCalendarBtn.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)';
                });
                
                newCalendarBtn.addEventListener('mouseleave', () => {
                    newCalendarBtn.style.transform = 'translateY(0)';
                    newCalendarBtn.style.boxShadow = 'none';
                });
                
                // Insert the new button in the same position
                buttonContainer.appendChild(newCalendarBtn);
                
                console.log('=== SIDEPANEL.JS: New calendar button created and added ===');
            }
            
            if (cancelBtn) {
                cancelBtn.textContent = chrome.i18n.getMessage('close');
                cancelBtn.onclick = () => {
                    closeSidePanel();
                };
            }
            
            transformSaveButtonToCalendarButton();
            console.log('transformSaveButtonToCalendarButton called');
            
            // Update current event in array
            if (currentEvents[currentEventIndex]) {
                currentEvents[currentEventIndex] = { ...currentEvents[currentEventIndex], ...eventData };
            }
            
        } else {
            showError(response.error || chrome.i18n.getMessage('errorRegisteringSchedule'));
        }
        
    } catch (error) {
        console.error('Save error:', error);
        showError(chrome.i18n.getMessage('errorSavingSchedule'));
    } finally {
        isSaving = false; // Reset saving flag
        console.log('Setting isSaving to false');
        saveBtn.disabled = false;
        saveBtn.textContent = chrome.i18n.getMessage('save');
    }
}

// Close side panel
function closeSidePanel() {
    window.close();
}

// Transform save button to Google Calendar button
function transformSaveButtonToCalendarButton() {
    console.log('transformSaveButtonToCalendarButton called');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    console.log('Save button found:', saveBtn);
    console.log('Cancel button found:', cancelBtn);
    
    if (saveBtn && cancelBtn) {
        // Get current event data
        const currentEvent = currentEvents[currentEventIndex];
        const hasEventData = currentEvent?.eventId || currentEvent?.htmlLink;
        
        // Replace save button with new calendar button
        console.log('=== SIDEPANEL.JS: transformSaveButtonToCalendarButton - Replacing button ===');
        
        // Remove the old button completely
        const buttonContainer = saveBtn.parentNode;
        saveBtn.remove();
        
        // Create new calendar button
        const newCalendarBtn = document.createElement('button');
        newCalendarBtn.id = 'saveBtn'; // Keep same ID for consistency
        newCalendarBtn.textContent = '📅 캘린더 이동';
        newCalendarBtn.className = 'btn btn-primary';
        newCalendarBtn.style.cssText = `
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.625rem 1.25rem;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        // Add click event for Google Calendar (only once)
        newCalendarBtn.addEventListener('click', () => {
            console.log('=== SIDEPANEL.JS: transformSaveButtonToCalendarButton - Calendar button clicked ===');
            const currentEvent = currentEvents[currentEventIndex];
            const eventId = currentEvent?.eventId;
            const htmlLink = currentEvent?.htmlLink;
            
            if (htmlLink) {
                chrome.tabs.create({ url: htmlLink });
                console.log('Opening event using HTML link:', htmlLink);
            } else if (eventId) {
                const eventUrl = `https://calendar.google.com/calendar/u/0/event?eid=${eventId}`;
                chrome.tabs.create({ url: eventUrl });
                console.log('Opening specific event:', eventUrl);
            } else {
                chrome.tabs.create({ url: 'https://calendar.google.com/calendar/u/0/r' });
                console.log('Opening general Google Calendar (no event data)');
            }
            
            // Close side panel after opening Google Calendar
            setTimeout(() => {
                closeSidePanel();
            }, 500);
        });
        
        // Add hover effects
        newCalendarBtn.addEventListener('mouseenter', () => {
            newCalendarBtn.style.transform = 'translateY(-2px)';
            newCalendarBtn.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)';
        });
        
        newCalendarBtn.addEventListener('mouseleave', () => {
            newCalendarBtn.style.transform = 'translateY(0)';
            newCalendarBtn.style.boxShadow = 'none';
        });
        
        // Insert the new button in the same position
        buttonContainer.appendChild(newCalendarBtn);
        
        console.log('=== SIDEPANEL.JS: transformSaveButtonToCalendarButton - New calendar button created ===');
        
        // Change cancel button to close button
        cancelBtn.textContent = '닫기';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.onclick = () => {
            closeSidePanel();
        };
        
        // Add hover effects
        saveBtn.addEventListener('mouseenter', () => {
            saveBtn.style.transform = 'translateY(-2px)';
            saveBtn.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)';
        });
        
        saveBtn.addEventListener('mouseleave', () => {
            saveBtn.style.transform = 'translateY(0)';
            saveBtn.style.boxShadow = 'none';
        });
        
        console.log('Save button transformed to Google Calendar button');
    }
}


// Show loading state
function showLoading() {
    loadingState.classList.add('show');
    mainContainer.style.display = 'none';
    hideMessages();
}

// Hide loading state
function hideLoading() {
    loadingState.classList.remove('show');
    mainContainer.style.display = 'block';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

// Hide messages
function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

// Utility functions
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatEventTime(event) {
    if (!event.startDate) return chrome.i18n.getMessage('timeTBD');
    
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Use browser locale for time formatting
    const locale = navigator.language || 'en-US';
    const startTime = startDate.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const endTime = endDate.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `${startTime} - ${endTime}`;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function parseReminder(reminderText) {
    if (!reminderText) return 15;
    
    const minutes = parseInt(reminderText.replace(/[^\d]/g, ''));
    if (isNaN(minutes)) return 15;
    
    return minutes;
}

// Global functions for HTML onclick handlers
window.removeAttendee = removeAttendee;

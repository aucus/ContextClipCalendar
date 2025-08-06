// ContextClipCalendar Calendar Utilities
// Google Calendar API utilities for content scripts

console.log('ContextClipCalendar Calendar utilities loaded');

// Google Calendar API utility module for content scripts
class GoogleCalendarAPI {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    }

    // Basic API call function (content script version)
    async callAPI(endpoint, options = {}) {
        if (!this.accessToken) {
            throw new Error('Google Calendar access token is missing.');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        console.log('Google Calendar API call (content script):', {
            url: url,
            method: config.method,
            body: options.body ? JSON.parse(options.body) : null
        });

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { error: { message: response.statusText } };
                }
                
                console.error('Google Calendar API error details (content script):', {
                    status: response.status,
                    statusText: response.statusText,
                    url: url,
                    method: config.method,
                    errorData: errorData,
                    requestBody: options.body ? JSON.parse(options.body) : null
                });
                
                // Generate specific error message
                let errorMessage = `Calendar API error (${response.status})`;
                if (errorData.error) {
                    if (errorData.error.message) {
                        errorMessage += `: ${errorData.error.message}`;
                    }
                    if (errorData.error.details && errorData.error.details.length > 0) {
                        errorMessage += ` - ${errorData.error.details.map(d => d.message).join(', ')}`;
                    }
                }
                
                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            console.log('Google Calendar API response successful (content script):', responseData);
            return responseData;
        } catch (error) {
            console.error('Google Calendar API call error (content script):', error);
            throw error;
        }
    }

    // Get calendar list (content script version)
    async getCalendarList() {
        try {
            const response = await this.callAPI('/users/me/calendarList');
            return response.items || [];
        } catch (error) {
            throw new Error(`Failed to get calendar list: ${error.message}`);
        }
    }

    // Get primary calendar information (content script version)
    async getPrimaryCalendar() {
        try {
            const response = await this.callAPI('/calendars/primary');
            return response;
        } catch (error) {
            throw new Error(`Failed to get primary calendar: ${error.message}`);
        }
    }

    // Create event (content script version)
    async createEvent(calendarId, eventData) {
        try {
            console.log('Creating event (content script):', {
                calendarId: calendarId,
                eventData: eventData
            });

            const result = await this.callAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events`,
                {
                    method: 'POST',
                    body: JSON.stringify(eventData)
                }
            );

            console.log('Event created successfully (content script):', result);
            return result;
        } catch (error) {
            console.error('Event creation error (content script):', error);
            throw error;
        }
    }

    // Format event data (content script version)
    formatEventData(calendarData) {
        const startDate = new Date(calendarData.startDate);
        const endDate = new Date(calendarData.endDate);

        // Description formatting improvement
        const description = (calendarData.description && typeof calendarData.description === 'string') 
            ? this.improveDescriptionFormatting(calendarData.description.trim())
            : '';

        // Validate and filter attendee emails
        const validAttendees = this.filterValidAttendees(calendarData.attendees || []);

        return {
            summary: calendarData.title,
            description: description,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'Asia/Seoul'
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Asia/Seoul'
            },
            location: calendarData.location,
            attendees: validAttendees,
            reminders: {
                useDefault: false,
                overrides: [
                    {
                        method: 'popup',
                        minutes: 15
                    }
                ]
            }
        };
    }

    // Filter valid attendee emails (content script version)
    filterValidAttendees(attendees) {
        if (!Array.isArray(attendees)) {
            console.log('Attendees is not array, returning empty array (content script)');
            return [];
        }

        const validAttendees = [];
        
        for (const attendee of attendees) {
            let email = '';
            
            if (typeof attendee === 'string') {
                email = attendee.trim();
            } else if (attendee && typeof attendee === 'object' && attendee.email) {
                email = attendee.email.trim();
            } else if (attendee && typeof attendee === 'object') {
                const firstKey = Object.keys(attendee)[0];
                if (firstKey) {
                    email = attendee[firstKey].trim();
                }
            }
            
            if (this.isValidEmail(email)) {
                validAttendees.push({ email });
                console.log('Valid attendee added (content script):', email);
            } else {
                console.log('Invalid email excluded (content script):', email);
            }
        }
        
        console.log('Filtered attendees count (content script):', validAttendees.length);
        return validAttendees;
    }

    // Email validation (content script version)
    isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return false;
        }
        
        const parts = email.split('@');
        if (parts.length !== 2) {
            return false;
        }
        
        const domain = parts[1];
        const domainParts = domain.split('.');
        if (domainParts.length < 2) {
            return false;
        }
        
        const tld = domainParts[domainParts.length - 1];
        if (tld.length < 2) {
            return false;
        }
        
        return true;
    }

    // Improve description formatting (content script version)
    improveDescriptionFormatting(description) {
        console.log('=== improveDescriptionFormatting called (content script) ===');
        console.log('Input description:', description);
        
        if (!description || typeof description !== 'string') {
            console.log('Invalid description, returning original (content script)');
            return description;
        }

        let improved = description;
        
        // Add line breaks after periods (sentence separation)
        improved = improved.replace(/\.\s+/g, '.\n');
        
        // Handle hyphens (keep date format, add line breaks for other hyphens)
        improved = improved.replace(/([^\n])\s*-\s*([^\d])/g, '$1\n- $2');
        
        // Add line breaks after colons (label separation)
        improved = improved.replace(/:\s+/g, ':\n');
        
        // Add line breaks before parentheses
        improved = improved.replace(/([^\n])(\()/g, '$1\n$2');
        
        // Add line breaks after commas (specific patterns)
        improved = improved.replace(/(진행\))(,)/g, '$1\n$2');
        
        // Clean up multiple consecutive line breaks (3+ to 2)
        improved = improved.replace(/\n\n\n+/g, '\n\n');
        
        // Trim leading/trailing spaces
        improved = improved.trim();
        
        console.log('Improved description (content script):', improved);
        console.log('=== improveDescriptionFormatting completed (content script) ===');
        
        return improved;
    }

    // Check duplicate event (content script version)
    async checkDuplicateEvent(calendarId, eventData) {
        try {
            const startTime = new Date(eventData.start.dateTime);
            const endTime = new Date(eventData.end.dateTime);
            
            // Set time range wider (30 minutes before/after)
            const timeMin = new Date(startTime.getTime() - 30 * 60 * 1000).toISOString();
            const timeMax = new Date(endTime.getTime() + 30 * 60 * 1000).toISOString();

            const events = await this.callAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`
            );

            // Check if there's an event with the same title
            const duplicateTitle = events.items.find(event => 
                event.summary && event.summary.toLowerCase() === eventData.summary.toLowerCase()
            );

            return duplicateTitle !== undefined;
        } catch (error) {
            console.error('Duplicate event check error (content script):', error);
            return false;
        }
    }

    // Get events for a specific time range (content script version)
    async getEvents(calendarId, timeMin, timeMax) {
        try {
            const events = await this.callAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
            );

            return events.items || [];
        } catch (error) {
            console.error('Get events error (content script):', error);
            throw new Error(`Failed to get events: ${error.message}`);
        }
    }

    // Update event (content script version)
    async updateEvent(calendarId, eventId, eventData) {
        try {
            console.log('Updating event (content script):', {
                calendarId: calendarId,
                eventId: eventId,
                eventData: eventData
            });

            const result = await this.callAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(eventData)
                }
            );

            console.log('Event updated successfully (content script):', result);
            return result;
        } catch (error) {
            console.error('Event update error (content script):', error);
            throw error;
        }
    }

    // Delete event (content script version)
    async deleteEvent(calendarId, eventId) {
        try {
            console.log('Deleting event (content script):', {
                calendarId: calendarId,
                eventId: eventId
            });

            await this.callAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
                {
                    method: 'DELETE'
                }
            );

            console.log('Event deleted successfully (content script)');
            return { success: true };
        } catch (error) {
            console.error('Event deletion error (content script):', error);
            throw error;
        }
    }

    // Get calendar colors (content script version)
    async getColors() {
        try {
            const colors = await this.callAPI('/colors');
            return colors;
        } catch (error) {
            console.error('Get colors error (content script):', error);
            throw new Error(`Failed to get colors: ${error.message}`);
        }
    }

    // Quick add event (content script version)
    async quickAddEvent(calendarId, text) {
        try {
            console.log('Quick add event (content script):', {
                calendarId: calendarId,
                text: text
            });

            const result = await this.callAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?text=${encodeURIComponent(text)}`,
                {
                    method: 'POST'
                }
            );

            console.log('Quick add event successful (content script):', result);
            return result;
        } catch (error) {
            console.error('Quick add event error (content script):', error);
            throw error;
        }
    }
}

// Utility functions for date/time handling (content script version)
class CalendarUtils {
    // Parse natural language time expressions
    static parseNaturalTime(timeExpression, baseDate = new Date()) {
        const expr = timeExpression.toLowerCase().trim();
        const result = new Date(baseDate);
        
        try {
            // Today expressions
            if (expr.includes('오늘') || expr.includes('today')) {
                // Keep current date
            }
            // Tomorrow expressions
            else if (expr.includes('내일') || expr.includes('tomorrow')) {
                result.setDate(result.getDate() + 1);
            }
            // Next week expressions
            else if (expr.includes('다음주') || expr.includes('next week')) {
                result.setDate(result.getDate() + 7);
            }
            // Day of week expressions
            else if (expr.includes('월요일') || expr.includes('monday')) {
                const daysUntilMonday = (8 - result.getDay()) % 7 || 7;
                result.setDate(result.getDate() + daysUntilMonday);
            }
            else if (expr.includes('화요일') || expr.includes('tuesday')) {
                const daysUntilTuesday = (9 - result.getDay()) % 7 || 7;
                result.setDate(result.getDate() + daysUntilTuesday);
            }
            else if (expr.includes('수요일') || expr.includes('wednesday')) {
                const daysUntilWednesday = (10 - result.getDay()) % 7 || 7;
                result.setDate(result.getDate() + daysUntilWednesday);
            }
            else if (expr.includes('목요일') || expr.includes('thursday')) {
                const daysUntilThursday = (11 - result.getDay()) % 7 || 7;
                result.setDate(result.getDate() + daysUntilThursday);
            }
            else if (expr.includes('금요일') || expr.includes('friday')) {
                const daysUntilFriday = (12 - result.getDay()) % 7 || 7;
                result.setDate(result.getDate() + daysUntilFriday);
            }
            
            // Time expressions
            if (expr.includes('오전') || expr.includes('am')) {
                const hourMatch = expr.match(/(\d+)시/);
                if (hourMatch) {
                    const hour = parseInt(hourMatch[1]);
                    result.setHours(hour < 12 ? hour : hour % 12, 0, 0, 0);
                }
            }
            else if (expr.includes('오후') || expr.includes('pm')) {
                const hourMatch = expr.match(/(\d+)시/);
                if (hourMatch) {
                    const hour = parseInt(hourMatch[1]);
                    result.setHours(hour === 12 ? 12 : hour + 12, 0, 0, 0);
                }
            }
            else {
                // 24-hour format
                const timeMatch = expr.match(/(\d+):(\d+)/);
                if (timeMatch) {
                    result.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
                }
                else {
                    const hourMatch = expr.match(/(\d+)시/);
                    if (hourMatch) {
                        const hour = parseInt(hourMatch[1]);
                        result.setHours(hour, 0, 0, 0);
                    }
                }
            }
            
            return result;
        } catch (error) {
            console.error('Natural time parsing error (content script):', error);
            return baseDate;
        }
    }

    // Format date for display
    static formatDisplayDate(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return '날짜 없음';
        }

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            timeZone: 'Asia/Seoul'
        };

        return date.toLocaleDateString('ko-KR', options);
    }

    // Format time for display
    static formatDisplayTime(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return '시간 없음';
        }

        const options = {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul'
        };

        return date.toLocaleTimeString('ko-KR', options);
    }

    // Check if time is business hours
    static isBusinessHours(date) {
        if (!(date instanceof Date)) return false;
        
        const hour = date.getHours();
        const day = date.getDay();
        
        // Monday to Friday, 9 AM to 6 PM
        return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
    }

    // Calculate event duration in minutes
    static calculateDuration(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
            return 0;
        }
        
        return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    }
}

// Export for use in content scripts (if needed)
if (typeof window !== 'undefined') {
    window.ContextClipGoogleCalendarAPI = GoogleCalendarAPI;
    window.ContextClipCalendarUtils = CalendarUtils;
}

console.log('ContextClipCalendar Calendar utilities initialized successfully');
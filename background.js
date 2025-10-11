// ContextClipCalendar Background Service Worker
// Integrated AI and Calendar API functionality

// Base LLM API class
class BaseLLMAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async callAPI(prompt, options = {}) {
        throw new Error('callAPI method must be implemented.');
    }

    async extractCalendarInfo(text) {
        throw new Error('extractCalendarInfo method must be implemented.');
    }

    async generateSummary(text, maxLength = 200) {
        throw new Error('generateSummary method must be implemented.');
    }

    async analyzeCalendarText(text) {
        throw new Error('analyzeCalendarText method must be implemented.');
    }

    // Common utility methods
    extractJSONFromResponse(response) {
        try {
            console.log('=== JSON extraction attempt ===');
            console.log('Original response length:', response.length);
            console.log('Original response:', response);
            
            // Clean response (remove leading/trailing whitespace, unnecessary characters)
            let cleanedResponse = response.trim();
            console.log('Cleaned response:', cleanedResponse);
            
            // Find JSON block (```json ... ```)
            const jsonBlockMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                console.log('JSON block found:', jsonBlockMatch[1]);
                return JSON.parse(jsonBlockMatch[1]);
            }
            
            // Find JSON block (``` ... ```) - without json tag
            const codeBlockMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                const blockContent = codeBlockMatch[1].trim();
                console.log('Code block found:', blockContent);
                // Check if block content is JSON
                if (blockContent.startsWith('{') && blockContent.endsWith('}')) {
                    return JSON.parse(blockContent);
                }
            }
            
            // Find JSON surrounded by braces (largest one)
            const jsonMatches = cleanedResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
            if (jsonMatches && jsonMatches.length > 0) {
                // Select the longest JSON string
                const longestJson = jsonMatches.reduce((a, b) => a.length > b.length ? a : b);
                console.log('Brace JSON found:', longestJson);
                return JSON.parse(longestJson);
            }
            
            // More lenient JSON search
            const relaxedJsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
            if (relaxedJsonMatch) {
                console.log('Lenient JSON found:', relaxedJsonMatch[0]);
                return JSON.parse(relaxedJsonMatch[0]);
            }
            
            // Find JSON array surrounded by brackets
            const arrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                console.log('Array JSON found:', arrayMatch[0]);
                return JSON.parse(arrayMatch[0]);
            }
            
            // Last attempt: extract JSON part from response
            const jsonStart = cleanedResponse.indexOf('{');
            const jsonEnd = cleanedResponse.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                const extractedJson = cleanedResponse.substring(jsonStart, jsonEnd + 1);
                console.log('JSON part extracted:', extractedJson);
                return JSON.parse(extractedJson);
            }
            
            console.warn('No JSON pattern found');
            return null;
        } catch (error) {
            console.error('JSON extraction failed:', error);
            console.log('Failed response:', response);
            
            // Try to extract and clean JSON from markdown code blocks
            try {
                const cleanedResponse = response
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .replace(/^```|```$/g, '')
                    .trim();
                
                console.log('Cleaned response for retry:', cleanedResponse);
                
                // Try to find JSON object
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonStr = jsonMatch[0];
                    console.log('Extracted JSON string:', jsonStr);
                    return JSON.parse(jsonStr);
                }
                
                // Try to find JSON array
                const arrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    const jsonStr = arrayMatch[0];
                    console.log('Extracted JSON array:', jsonStr);
                    return JSON.parse(jsonStr);
                }
                
            } catch (retryError) {
                console.error('Retry JSON parsing also failed:', retryError);
            }
            
            return null;
        }
    }

    extractTitleFromText(text) {
        try {
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length > 0) {
                const firstLine = lines[0].trim();
                
                // Extract title based on colon pattern
                const colonMatch = firstLine.match(/^([^:]+):/);
                if (colonMatch && colonMatch[1]) {
                    const title = colonMatch[1].trim();
                    if (title.length >= 2 && title.length <= 30 && !this.isCommonWord(title)) {
                        return title;
                    }
                }
                
                // Extract title with keyword patterns
                const keywordPatterns = [
                    /(팀\s*미팅)/i,
                    /(고객\s*상담)/i,
                    /(프로젝트\s*[가-힣a-zA-Z]+)/i,
                    /([가-힣a-zA-Z]+\s*미팅)/i,
                    /([가-힣a-zA-Z]+\s*회의)/i,
                    /([가-힣a-zA-Z]+\s*이벤트)/i,
                    /([가-힣a-zA-Z]+\s*배포)/i,
                    /([가-힣a-zA-Z]+\s*마감일)/i,
                    /(Zoom\s*미팅)/i,
                    /(Teams\s*미팅)/i
                ];
                
                for (const pattern of keywordPatterns) {
                    const match = firstLine.match(pattern);
                    if (match && match[1]) {
                        const title = match[1].trim();
                        if (title.length >= 2 && title.length <= 30) {
                            return title;
                        }
                    }
                }
                
                // Extract first meaningful phrase (within 20 characters)
                const meaningfulMatch = firstLine.match(/^([가-힣a-zA-Z0-9\s\-\(\)]{2,20})/);
                if (meaningfulMatch && meaningfulMatch[1]) {
                    const title = meaningfulMatch[1].trim();
                    if (!this.isCommonWord(title) && !this.isTimeExpression(title)) {
                        return title;
                    }
                }
            }
            
            // Keyword-based title generation
            const keywords = this.extractKeywords(text);
            if (keywords.length > 0) {
                const meaningfulKeywords = keywords.filter(keyword => 
                    !this.isCommonWord(keyword) && !this.isTimeExpression(keyword)
                );
                
                if (meaningfulKeywords.length > 0) {
                    return meaningfulKeywords.slice(0, 2).join(' ');
                }
            }
            
            return null;
        } catch (error) {
            console.error('제목 추출 실패:', error);
            return null;
        }
    }

    isTimeExpression(text) {
        const timePatterns = [
            /^\d{1,2}시/, /^\d{1,2}분/, /^오전/, /^오후/, /^내일/, /^오늘/, /^다음주/,
            /^\d{4}년/, /^\d{1,2}월/, /^\d{1,2}일/,
            /^월요일/, /^화요일/, /^수요일/, /^목요일/, /^금요일/, /^토요일/, /^일요일/
        ];
        
        return timePatterns.some(pattern => pattern.test(text));
    }

    cleanResponse(response) {
        try {
            let cleaned = response.trim();
            cleaned = cleaned.replace(/```[a-zA-Z]*\n?/g, '');
            cleaned = cleaned.replace(/^[^{]*({.*})[^}]*$/s, '$1');
            cleaned = cleaned.replace(/\\"/g, '"');
            cleaned = cleaned.replace(/\\n/g, '\n');
            cleaned = cleaned.replace(/\\t/g, '\t');
            
            return cleaned;
        } catch (error) {
            console.error('응답 정리 실패:', error);
            return response;
        }
    }

    isCommonWord(word) {
        const commonWords = [
            '이', '그', '저', '이것', '그것', '저것',
            '있', '없', '하', '되', '보', '들', '것',
            '일', '때', '곳', '수', '말', '년', '월', '일',
            '시', '분', '초', '오전', '오후', '내일', '오늘',
            '회의', '미팅', '약속', '일정', '이벤트'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    extractKeywords(text) {
        try {
            const koreanNouns = text.match(/[가-힣]{2,}/g) || [];
            const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
            const numberWords = text.match(/[가-힣a-zA-Z]*\d+[가-힣a-zA-Z]*/g) || [];
            
            const allKeywords = [...koreanNouns, ...englishWords, ...numberWords];
            const uniqueKeywords = [...new Set(allKeywords)];
            
            uniqueKeywords.sort((a, b) => b.length - a.length);
            
            return uniqueKeywords.slice(0, 5);
        } catch (error) {
            console.error('키워드 추출 실패:', error);
            return [];
        }
    }

    mergeAndValidateAttendees(attendees1, attendees2) {
        try {
            const allAttendees = [...(attendees1 || []), ...(attendees2 || [])];
            const validEmails = new Set();
            const validAttendees = [];
            
            for (const attendee of allAttendees) {
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
                
                if (email && this.isValidEmail(email) && !validEmails.has(email.toLowerCase())) {
                    validEmails.add(email.toLowerCase());
                    validAttendees.push(email);
                    console.log('유효한 참석자 이메일 추가:', email);
                } else if (email) {
                    console.log('유효하지 않거나 중복된 이메일 제외:', email);
                }
            }
            
            console.log('병합된 유효한 참석자 수:', validAttendees.length);
            return validAttendees;
        } catch (error) {
            console.error('참석자 병합 오류:', error);
            return [];
        }
    }

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
}

// Claude API implementation
class ClaudeAPI extends BaseLLMAPI {
    constructor(apiKey) {
        super(apiKey);
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
    }

    async callAPI(prompt, options = {}) {
        try {
            console.log('=== Claude API 호출 시작 ===');
            console.log('API URL:', this.baseUrl);
            console.log('프롬프트 길이:', prompt.length);
            console.log('프롬프트 미리보기:', prompt.substring(0, 200) + '...');
            
            const requestBody = {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            };
            
            console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('HTTP 응답 상태:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP 오류 응답 본문:', errorText);
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('=== 원본 응답 텍스트 ===');
            console.log(responseText);
            console.log('=== 원본 응답 텍스트 끝 ===');
            
            const data = JSON.parse(responseText);
            console.log('=== 파싱된 응답 데이터 ===');
            console.log(JSON.stringify(data, null, 2));
            console.log('=== 파싱된 응답 데이터 끝 ===');
            
            if (data.content && data.content[0] && data.content[0].text) {
                const text = data.content[0].text;
                console.log('=== 추출된 텍스트 ===');
                console.log(text);
                console.log('=== 추출된 텍스트 끝 ===');
                return text;
            } else {
                console.error('응답 구조 문제:', data);
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('=== Claude API 호출 오류 ===');
            console.error('오류 타입:', error.constructor.name);
            console.error('오류 메시지:', error.message);
            console.error('오류 스택:', error.stack);
            throw error;
        }
    }

    async extractCalendarInfo(text) {
        const prompt = `
다음 텍스트를 분석하여 캘린더에 저장할 일정 정보를 정확하게 추출해주세요.

텍스트: "${text}"

분석 요구사항:

1. 제목(title) 추출:
   - 텍스트의 맥락을 분석하여 가장 적절한 일정 제목을 추출하세요
   - 회의명, 미팅명, 약속명, 이벤트명 등이 있으면 그것을 우선 사용
   - 없으면 텍스트의 핵심 키워드를 조합하여 간결하고 명확한 제목 생성
   - 제목은 50자 이내로 작성하고, 일정의 성격을 명확히 표현

2. 날짜/시간 정보 분석:
   - 텍스트에서 명시된 날짜와 시간을 정확히 파악
   - "내일", "다음주 월요일", "오후 3시" 등의 상대적 표현을 현재 시간 기준으로 계산
   - 날짜만 있고 시간이 없는 경우: 오전 9시로 설정
   - 시간만 있고 날짜가 없는 경우: 오늘 날짜로 설정
   - 시작 시간과 종료 시간을 모두 추출 (종료 시간이 없으면 시작 시간 + 1시간)

3. 일정 내용 요약(description):
   - 텍스트를 캘린더에 저장할 내용으로 요약
   - 핵심 정보만 추출하여 간결하게 작성
   - 원본 텍스트의 중요한 세부사항 포함

4. 장소(location) 추출:
   - 회의실, 주소, 온라인 플랫폼, 건물명 등
   - 텍스트에서 장소 관련 정보가 있으면 추출

5. 참석자(attendees) 추출:
   - 이메일 주소나 이름으로 된 참석자 목록
   - "참석자:", "참가자:", "함께:" 등의 키워드 뒤에 오는 사람들

현재 시간: ${new Date().toISOString()}
현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

중요: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.

{
    "title": "일정 제목",
    "description": "일정 설명",
    "startDate": "YYYY-MM-DDTHH:MM:SS",
    "endDate": "YYYY-MM-DDTHH:MM:SS", 
    "location": "장소",
    "attendees": ["참석자1", "참석자2"],
    "reminder": "15분 전"
}

주의사항:
- 반드시 유효한 JSON 형식으로만 응답하세요
- 날짜/시간 형식은 ISO 8601 표준을 따르세요 (YYYY-MM-DDTHH:MM:SS)
- 시간대는 한국 시간(Asia/Seoul)을 기준으로 하세요
- 제목은 50자 이내로 간결하게 작성하세요
- 텍스트에 날짜/시간 정보가 없으면 현재 시간 기준으로 설정하세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요
- 마크다운 코드 블록(\`\`\`)을 사용하지 마세요
- 응답은 순수한 JSON 객체만 포함해야 합니다
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            console.log('Claude API 원본 응답:', response);
            
            try {
                console.log('원본 응답:', response);
                
                // Try direct JSON parsing first
                const parsed = JSON.parse(response);
                console.log('JSON 파싱 성공:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('JSON 파싱 실패:', parseError);
                console.log('파싱 실패한 응답:', response);
                
                // Try to clean and extract JSON
                try {
                    const cleanedResponse = response
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*/g, '')
                        .replace(/^```|```$/g, '')
                        .trim();
                    
                    console.log('Cleaned response:', cleanedResponse);
                    
                    // Try to find JSON object
                    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const jsonStr = jsonMatch[0];
                        console.log('Extracted JSON string:', jsonStr);
                        return JSON.parse(jsonStr);
                    }
                    
                    // Try to find JSON array
                    const arrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
                    if (arrayMatch) {
                        const jsonStr = arrayMatch[0];
                        console.log('Extracted JSON array:', jsonStr);
                        return JSON.parse(jsonStr);
                    }
                    
                } catch (cleanError) {
                    console.error('JSON cleaning failed:', cleanError);
                }
                
                // JSON 추출 시도
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('JSON 추출 성공:', extractedJson);
                    return extractedJson;
                }
                
                // 응답 정리 후 재시도
                const cleanedResponse = this.cleanResponse(response);
                if (cleanedResponse !== response) {
                    console.log('응답 정리 후 재시도:', cleanedResponse);
                    try {
                        const parsedCleaned = JSON.parse(cleanedResponse);
                        console.log('정리된 응답 파싱 성공:', parsedCleaned);
                        return parsedCleaned;
                    } catch (cleanError) {
                        console.log('정리된 응답도 파싱 실패');
                    }
                }
                
                // 텍스트에서 제목 추출 시도
                const extractedTitle = this.extractTitleFromText(text);
                console.log('텍스트에서 추출한 제목:', extractedTitle);
                
                // 제목 추출 실패 시 오류 발생
                if (!extractedTitle) {
                    throw new Error('제공된 텍스트에서 일정 정보를 추출할 수 없습니다.');
                }
                
                return {
                    title: extractedTitle,
                    description: text,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    location: '',
                    attendees: [],
                    reminder: ''
                };
            }
        } catch (error) {
            console.error('API 호출 실패:', error);
            throw new Error(`일정 정보 추출 실패: ${error.message}`);
        }
    }

    async generateSummary(text, maxLength = 200) {
        const prompt = `
다음 텍스트를 ${maxLength}자 이내로 요약해주세요.

텍스트: "${text}"

요구사항:
1. 핵심 내용만 추출
2. 명확하고 이해하기 쉽게 작성
3. ${maxLength}자 이내로 제한
4. 한국어로 작성
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            return response;
        } catch (error) {
            throw new Error(`요약 생성 실패: ${error.message}`);
        }
    }

    async analyzeCalendarText(text) {
        const prompt = `
다음 텍스트를 일정 관점에서 상세히 분석해주세요. JSON 형식으로만 응답해주세요.

텍스트: "${text}"

분석 요구사항:

1. 일정 유형 분석:
   - meeting: 회의/미팅
   - appointment: 약속/상담
   - event: 이벤트/행사
   - reminder: 알림/할일
   - deadline: 마감일/기한

2. 시간 정보 상세 분석:
   - 명시적 시간: "오후 3시", "14:30" 등
   - 상대적 시간: "내일", "다음주 월요일" 등
   - 기간: "3일간", "1주일" 등
   - 반복: "매주", "매일" 등

3. 참석자 정보:
   - 이메일 주소가 있는 경우에만 포함하세요
   - 이름만 있는 경우는 제외하세요 (Google Calendar API는 유효한 이메일만 허용)
   - 참석자 수 (정확한 숫자 또는 "여러 명" 등)

4. 장소 정보:
   - 구체적 주소
   - 건물/회의실명
   - 온라인 플랫폼 (Zoom, Teams 등)

5. 우선순위/중요도:
   - urgent: 긴급
   - important: 중요
   - normal: 일반
   - low: 낮음

현재 시간: ${new Date().toISOString()}
현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

응답 형식 (JSON만):
{
    "eventType": "meeting|appointment|event|reminder|deadline",
    "timeAnalysis": {
        "explicitTime": "명시된 시간 정보",
        "relativeTime": "상대적 시간 표현",
        "duration": "기간 정보",
        "recurring": "반복 정보"
    },
    "participants": {
        "names": ["참석자1", "참석자2"],
        "count": "참석자 수",
        "emails": ["email1@example.com"]
    },
    "location": {
        "type": "physical|online|hybrid",
        "address": "구체적 주소",
        "room": "회의실/건물명",
        "platform": "온라인 플랫폼"
    },
    "priority": "urgent|important|normal|low",
    "confidence": 0.0-1.0
}

주의사항:
- 참석자 이메일은 유효한 이메일 주소만 포함하세요
- 이름만 있는 경우는 emails 배열에 포함하지 마세요
- description에는 줄바꿈(\\n)을 사용하여 가독성을 높이세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            console.log('일정 분석 API 응답:', response);
            
            try {
                const parsed = JSON.parse(response);
                console.log('일정 분석 JSON 파싱 성공:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('일정 분석 JSON 파싱 실패:', parseError);
                console.log('파싱 실패한 응답:', response);
                
                // JSON 추출 시도
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('일정 분석 JSON 추출 성공:', extractedJson);
                    return extractedJson;
                }
                
                console.warn('JSON 추출도 실패, 기본값 사용');
                return {
                    eventType: 'meeting',
                    timeAnalysis: {},
                    participants: { names: [], count: 0, emails: [] },
                    location: { type: 'physical', address: '', room: '', platform: '' },
                    priority: 'normal',
                    confidence: 0.5
                };
            }
        } catch (error) {
            console.error('일정 분석 API 호출 실패:', error);
            throw new Error(`일정 분석 실패: ${error.message}`);
        }
    }
}

// ChatGPT API implementation
class ChatGPTAPI extends BaseLLMAPI {
    constructor(apiKey) {
        super(apiKey);
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    }

    async callAPI(prompt, options = {}) {
        try {
            console.log('=== ChatGPT API 호출 시작 ===');
            console.log('API URL:', this.baseUrl);
            console.log('프롬프트 길이:', prompt.length);
            console.log('프롬프트 미리보기:', prompt.substring(0, 200) + '...');
            
            const requestBody = {
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            };
            
            console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('HTTP 응답 상태:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP 오류 응답 본문:', errorText);
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('=== 원본 응답 텍스트 ===');
            console.log(responseText);
            console.log('=== 원본 응답 텍스트 끝 ===');
            
            const data = JSON.parse(responseText);
            console.log('=== 파싱된 응답 데이터 ===');
            console.log(JSON.stringify(data, null, 2));
            console.log('=== 파싱된 응답 데이터 끝 ===');
            
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                const text = data.choices[0].message.content;
                console.log('=== 추출된 텍스트 ===');
                console.log(text);
                console.log('=== 추출된 텍스트 끝 ===');
                return text;
            } else {
                console.error('응답 구조 문제:', data);
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('=== ChatGPT API 호출 오류 ===');
            console.error('오류 타입:', error.constructor.name);
            console.error('오류 메시지:', error.message);
            console.error('오류 스택:', error.stack);
            throw error;
        }
    }

    async extractCalendarInfo(text) {
        const prompt = `
다음 텍스트를 분석하여 캘린더에 저장할 일정 정보를 정확하게 추출해주세요.

텍스트: "${text}"

분석 요구사항:

1. 제목(title) 추출:
   - 텍스트의 맥락을 분석하여 가장 적절한 일정 제목을 추출하세요
   - 회의명, 미팅명, 약속명, 이벤트명 등이 있으면 그것을 우선 사용
   - 없으면 텍스트의 핵심 키워드를 조합하여 간결하고 명확한 제목 생성
   - 제목은 50자 이내로 작성하고, 일정의 성격을 명확히 표현

2. 날짜/시간 정보 분석:
   - 텍스트에서 명시된 날짜와 시간을 정확히 파악
   - "내일", "다음주 월요일", "오후 3시" 등의 상대적 표현을 현재 시간 기준으로 계산
   - 날짜만 있고 시간이 없는 경우: 오전 9시로 설정
   - 시간만 있고 날짜가 없는 경우: 오늘 날짜로 설정
   - 시작 시간과 종료 시간을 모두 추출 (종료 시간이 없으면 시작 시간 + 1시간)

3. 일정 내용 요약(description):
   - 텍스트를 캘린더에 저장할 내용으로 요약
   - 핵심 정보만 추출하여 간결하게 작성
   - 원본 텍스트의 중요한 세부사항 포함

4. 장소(location) 추출:
   - 회의실, 주소, 온라인 플랫폼, 건물명 등
   - 텍스트에서 장소 관련 정보가 있으면 추출

5. 참석자(attendees) 추출:
   - 이메일 주소나 이름으로 된 참석자 목록
   - "참석자:", "참가자:", "함께:" 등의 키워드 뒤에 오는 사람들

현재 시간: ${new Date().toISOString()}
현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

중요: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.

{
    "title": "일정 제목",
    "description": "일정 설명",
    "startDate": "YYYY-MM-DDTHH:MM:SS",
    "endDate": "YYYY-MM-DDTHH:MM:SS", 
    "location": "장소",
    "attendees": ["참석자1", "참석자2"],
    "reminder": "15분 전"
}

주의사항:
- 반드시 유효한 JSON 형식으로만 응답하세요
- 날짜/시간 형식은 ISO 8601 표준을 따르세요 (YYYY-MM-DDTHH:MM:SS)
- 시간대는 한국 시간(Asia/Seoul)을 기준으로 하세요
- 제목은 50자 이내로 간결하게 작성하세요
- 텍스트에 날짜/시간 정보가 없으면 현재 시간 기준으로 설정하세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요
- 마크다운 코드 블록(\`\`\`)을 사용하지 마세요
- 응답은 순수한 JSON 객체만 포함해야 합니다
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            console.log('ChatGPT API 원본 응답:', response);
            
            try {
                console.log('원본 응답:', response);
                const parsed = JSON.parse(response);
                console.log('JSON 파싱 성공:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('JSON 파싱 실패:', parseError);
                console.log('파싱 실패한 응답:', response);
                
                // JSON 추출 시도
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('JSON 추출 성공:', extractedJson);
                    return extractedJson;
                }
                
                // 응답 정리 후 재시도
                const cleanedResponse = this.cleanResponse(response);
                if (cleanedResponse !== response) {
                    console.log('응답 정리 후 재시도:', cleanedResponse);
                    try {
                        const parsedCleaned = JSON.parse(cleanedResponse);
                        console.log('정리된 응답 파싱 성공:', parsedCleaned);
                        return parsedCleaned;
                    } catch (cleanError) {
                        console.log('정리된 응답도 파싱 실패');
                    }
                }
                
                // 텍스트에서 제목 추출 시도
                const extractedTitle = this.extractTitleFromText(text);
                console.log('텍스트에서 추출한 제목:', extractedTitle);
                
                // 제목 추출 실패 시 오류 발생
                if (!extractedTitle) {
                    throw new Error('제공된 텍스트에서 일정 정보를 추출할 수 없습니다.');
                }
                
                return {
                    title: extractedTitle,
                    description: text,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    location: '',
                    attendees: [],
                    reminder: ''
                };
            }
        } catch (error) {
            console.error('API 호출 실패:', error);
            throw new Error(`일정 정보 추출 실패: ${error.message}`);
        }
    }

    async generateSummary(text, maxLength = 200) {
        const prompt = `
다음 텍스트를 ${maxLength}자 이내로 요약해주세요.

텍스트: "${text}"

요구사항:
1. 핵심 내용만 추출
2. 명확하고 이해하기 쉽게 작성
3. ${maxLength}자 이내로 제한
4. 한국어로 작성
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            return response;
        } catch (error) {
            throw new Error(`요약 생성 실패: ${error.message}`);
        }
    }

    async analyzeCalendarText(text) {
        const prompt = `
다음 텍스트를 일정 관점에서 상세히 분석해주세요. JSON 형식으로만 응답해주세요.

텍스트: "${text}"

분석 요구사항:

1. 일정 유형 분석:
   - meeting: 회의/미팅
   - appointment: 약속/상담
   - event: 이벤트/행사
   - reminder: 알림/할일
   - deadline: 마감일/기한

2. 시간 정보 상세 분석:
   - 명시적 시간: "오후 3시", "14:30" 등
   - 상대적 시간: "내일", "다음주 월요일" 등
   - 기간: "3일간", "1주일" 등
   - 반복: "매주", "매일" 등

3. 참석자 정보:
   - 이메일 주소가 있는 경우에만 포함하세요
   - 이름만 있는 경우는 제외하세요 (Google Calendar API는 유효한 이메일만 허용)
   - 참석자 수 (정확한 숫자 또는 "여러 명" 등)

4. 장소 정보:
   - 구체적 주소
   - 건물/회의실명
   - 온라인 플랫폼 (Zoom, Teams 등)

5. 우선순위/중요도:
   - urgent: 긴급
   - important: 중요
   - normal: 일반
   - low: 낮음

현재 시간: ${new Date().toISOString()}
현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

응답 형식 (JSON만):
{
    "eventType": "meeting|appointment|event|reminder|deadline",
    "timeAnalysis": {
        "explicitTime": "명시된 시간 정보",
        "relativeTime": "상대적 시간 표현",
        "duration": "기간 정보",
        "recurring": "반복 정보"
    },
    "participants": {
        "names": ["참석자1", "참석자2"],
        "count": "참석자 수",
        "emails": ["email1@example.com"]
    },
    "location": {
        "type": "physical|online|hybrid",
        "address": "구체적 주소",
        "room": "회의실/건물명",
        "platform": "온라인 플랫폼"
    },
    "priority": "urgent|important|normal|low",
    "confidence": 0.0-1.0
}

주의사항:
- 참석자 이메일은 유효한 이메일 주소만 포함하세요
- 이름만 있는 경우는 emails 배열에 포함하지 마세요
- description에는 줄바꿈(\\n)을 사용하여 가독성을 높이세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            console.log('일정 분석 API 응답:', response);
            
            try {
                const parsed = JSON.parse(response);
                console.log('일정 분석 JSON 파싱 성공:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('일정 분석 JSON 파싱 실패:', parseError);
                console.log('파싱 실패한 응답:', response);
                
                // JSON 추출 시도
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('일정 분석 JSON 추출 성공:', extractedJson);
                    return extractedJson;
                }
                
                console.warn('JSON 추출도 실패, 기본값 사용');
                return {
                    eventType: 'meeting',
                    timeAnalysis: {},
                    participants: { names: [], count: 0, emails: [] },
                    location: { type: 'physical', address: '', room: '', platform: '' },
                    priority: 'normal',
                    confidence: 0.5
                };
            }
        } catch (error) {
            console.error('일정 분석 API 호출 실패:', error);
            throw new Error(`일정 분석 실패: ${error.message}`);
        }
    }
}

// Gemini API implementation
class GeminiAPI extends BaseLLMAPI {
    constructor(apiKey) {
        super(apiKey);
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    async callAPI(prompt, options = {}) {
        try {
            console.log('=== Gemini API 호출 시작 ===');
            console.log('API URL:', this.baseUrl);
            console.log('프롬프트 길이:', prompt.length);
            console.log('프롬프트 미리보기:', prompt.substring(0, 200) + '...');
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 1000,
                }
            };
            
            console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('HTTP 응답 상태:', response.status, response.statusText);
            console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP 오류 응답 본문:', errorText);
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('=== 원본 응답 텍스트 ===');
            console.log(responseText);
            console.log('=== 원본 응답 텍스트 끝 ===');
            console.log('응답 텍스트 길이:', responseText.length);
            
            const data = JSON.parse(responseText);
            console.log('=== 파싱된 응답 데이터 ===');
            console.log(JSON.stringify(data, null, 2));
            console.log('=== 파싱된 응답 데이터 끝 ===');
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                console.log('=== 추출된 텍스트 ===');
                console.log(text);
                console.log('=== 추출된 텍스트 끝 ===');
                console.log('텍스트 길이:', text.length);
                return text;
            } else {
                console.error('응답 구조 문제:', data);
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('=== Gemini API 호출 오류 ===');
            console.error('오류 타입:', error.constructor.name);
            console.error('오류 메시지:', error.message);
            console.error('오류 스택:', error.stack);
            throw error;
        }
    }

    async extractCalendarInfo(text) {
        const prompt = `
다음 텍스트를 분석하여 캘린더에 저장할 일정 정보를 정확하게 추출해주세요.

텍스트: "${text}"

분석 요구사항:

1. 제목(title) 추출:
   - 텍스트의 맥락을 분석하여 가장 적절한 일정 제목을 추출하세요
   - 회의명, 미팅명, 약속명, 이벤트명 등이 있으면 그것을 우선 사용
   - 없으면 텍스트의 핵심 키워드를 조합하여 간결하고 명확한 제목 생성
   - 제목은 50자 이내로 작성하고, 일정의 성격을 명확히 표현

2. 날짜/시간 정보 분석:
   - 텍스트에서 명시된 날짜와 시간을 정확히 파악
   - "내일", "다음주 월요일", "오후 3시" 등의 상대적 표현을 현재 시간 기준으로 계산
   - 날짜만 있고 시간이 없는 경우: 오전 9시로 설정
   - 시간만 있고 날짜가 없는 경우: 오늘 날짜로 설정
   - 시작 시간과 종료 시간을 모두 추출 (종료 시간이 없으면 시작 시간 + 1시간)

3. 일정 내용 요약(description):
   - 텍스트를 캘린더에 저장할 내용으로 요약
   - 핵심 정보만 추출하여 간결하게 작성
   - 원본 텍스트의 중요한 세부사항 포함

4. 장소(location) 추출:
   - 회의실, 주소, 온라인 플랫폼, 건물명 등
   - 텍스트에서 장소 관련 정보가 있으면 추출

5. 참석자(attendees) 추출:
   - 이메일 주소나 이름으로 된 참석자 목록
   - "참석자:", "참가자:", "함께:" 등의 키워드 뒤에 오는 사람들

현재 시간: ${new Date().toISOString()}
현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

중요: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.

{
    "title": "일정 제목",
    "description": "일정 설명",
    "startDate": "YYYY-MM-DDTHH:MM:SS",
    "endDate": "YYYY-MM-DDTHH:MM:SS", 
    "location": "장소",
    "attendees": ["참석자1", "참석자2"],
    "reminder": "15분 전"
}

주의사항:
- 반드시 유효한 JSON 형식으로만 응답하세요
- 날짜/시간 형식은 ISO 8601 표준을 따르세요 (YYYY-MM-DDTHH:MM:SS)
- 시간대는 한국 시간(Asia/Seoul)을 기준으로 하세요
- 제목은 50자 이내로 간결하게 작성하세요
- 텍스트에 날짜/시간 정보가 없으면 현재 시간 기준으로 설정하세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요
- 마크다운 코드 블록(\`\`\`)을 사용하지 마세요
- 응답은 순수한 JSON 객체만 포함해야 합니다
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            console.log('Gemini API 원본 응답:', response);
            
            try {
                console.log('원본 응답:', response);
                const parsed = JSON.parse(response);
                console.log('JSON 파싱 성공:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('JSON 파싱 실패:', parseError);
                console.log('파싱 실패한 응답:', response);
                
                // JSON 추출 시도
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('JSON 추출 성공:', extractedJson);
                    return extractedJson;
                }
                
                // 응답 정리 후 재시도
                const cleanedResponse = this.cleanResponse(response);
                if (cleanedResponse !== response) {
                    console.log('응답 정리 후 재시도:', cleanedResponse);
                    try {
                        const parsedCleaned = JSON.parse(cleanedResponse);
                        console.log('정리된 응답 파싱 성공:', parsedCleaned);
                        return parsedCleaned;
                    } catch (cleanError) {
                        console.log('정리된 응답도 파싱 실패');
                    }
                }
                
                // 텍스트에서 제목 추출 시도
                const extractedTitle = this.extractTitleFromText(text);
                console.log('텍스트에서 추출한 제목:', extractedTitle);
                
                // 제목 추출 실패 시 오류 발생
                if (!extractedTitle) {
                    throw new Error('제공된 텍스트에서 일정 정보를 추출할 수 없습니다.');
                }
                
                return {
                    title: extractedTitle,
                    description: text,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    location: '',
                    attendees: [],
                    reminder: ''
                };
            }
        } catch (error) {
            console.error('API 호출 실패:', error);
            throw new Error(`일정 정보 추출 실패: ${error.message}`);
        }
    }

    async generateSummary(text, maxLength = 200) {
        const prompt = `
다음 텍스트를 ${maxLength}자 이내로 요약해주세요.

텍스트: "${text}"

요구사항:
1. 핵심 내용만 추출
2. 명확하고 이해하기 쉽게 작성
3. ${maxLength}자 이내로 제한
4. 한국어로 작성
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            return response;
        } catch (error) {
            throw new Error(`요약 생성 실패: ${error.message}`);
        }
    }

    async analyzeCalendarText(text) {
        const prompt = `
다음 텍스트를 일정 관점에서 상세히 분석해주세요. JSON 형식으로만 응답해주세요.

텍스트: "${text}"

분석 요구사항:

1. 일정 유형 분석:
   - meeting: 회의/미팅
   - appointment: 약속/상담
   - event: 이벤트/행사
   - reminder: 알림/할일
   - deadline: 마감일/기한

2. 시간 정보 상세 분석:
   - 명시적 시간: "오후 3시", "14:30" 등
   - 상대적 시간: "내일", "다음주 월요일" 등
   - 기간: "3일간", "1주일" 등
   - 반복: "매주", "매일" 등

3. 참석자 정보:
   - 이메일 주소가 있는 경우에만 포함하세요
   - 이름만 있는 경우는 제외하세요 (Google Calendar API는 유효한 이메일만 허용)
   - 참석자 수 (정확한 숫자 또는 "여러 명" 등)

4. 장소 정보:
   - 구체적 주소
   - 건물/회의실명
   - 온라인 플랫폼 (Zoom, Teams 등)

5. 우선순위/중요도:
   - urgent: 긴급
   - important: 중요
   - normal: 일반
   - low: 낮음

현재 시간: ${new Date().toISOString()}
현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

응답 형식 (JSON만):
{
    "eventType": "meeting|appointment|event|reminder|deadline",
    "timeAnalysis": {
        "explicitTime": "명시된 시간 정보",
        "relativeTime": "상대적 시간 표현",
        "duration": "기간 정보",
        "recurring": "반복 정보"
    },
    "participants": {
        "names": ["참석자1", "참석자2"],
        "count": "참석자 수",
        "emails": ["email1@example.com"]
    },
    "location": {
        "type": "physical|online|hybrid",
        "address": "구체적 주소",
        "room": "회의실/건물명",
        "platform": "온라인 플랫폼"
    },
    "priority": "urgent|important|normal|low",
    "confidence": 0.0-1.0
}

주의사항:
- 참석자 이메일은 유효한 이메일 주소만 포함하세요
- 이름만 있는 경우는 emails 배열에 포함하지 마세요
- description에는 줄바꿈(\\n)을 사용하여 가독성을 높이세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요
`;

        try {
            const response = await this.callAPI(prompt, { temperature: 0.3 });
            console.log('일정 분석 API 응답:', response);
            
            try {
                const parsed = JSON.parse(response);
                console.log('일정 분석 JSON 파싱 성공:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('일정 분석 JSON 파싱 실패:', parseError);
                console.log('파싱 실패한 응답:', response);
                
                // JSON 추출 시도
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('일정 분석 JSON 추출 성공:', extractedJson);
                    return extractedJson;
                }
                
                console.warn('JSON 추출도 실패, 기본값 사용');
                return {
                    eventType: 'meeting',
                    timeAnalysis: {},
                    participants: { names: [], count: 0, emails: [] },
                    location: { type: 'physical', address: '', room: '', platform: '' },
                    priority: 'normal',
                    confidence: 0.5
                };
            }
        } catch (error) {
            console.error('일정 분석 API 호출 실패:', error);
            throw new Error(`일정 분석 실패: ${error.message}`);
        }
    }
}

// Google Calendar API class
class GoogleCalendarAPI {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        console.log('Google Calendar API 요청:', {
            url: url,
            method: options.method || 'GET',
            body: options.body ? JSON.parse(options.body) : null
        });
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (parseError) {
                const errorText = await response.text();
                errorData = { error: { message: errorText || response.statusText } };
            }
            
            console.error('Google Calendar API 오류 상세:', {
                status: response.status,
                statusText: response.statusText,
                url: url,
                method: options.method || 'GET',
                errorData: errorData,
                requestBody: options.body ? JSON.parse(options.body) : null
            });
            
            let errorMessage = `Google Calendar API 오류 (${response.status})`;
            if (errorData.error) {
                if (errorData.error.message) {
                    errorMessage += `: ${errorData.error.message}`;
                }
                if (errorData.error.details && errorData.error.details.length > 0) {
                    errorMessage += ` - ${errorData.error.details.map(d => d.message).join(', ')}`;
                }
            }
            
            if (response.status === 401) {
                throw new Error(`인증 오류 (401): 토큰이 만료되었거나 유효하지 않습니다. 설정에서 다시 인증해주세요.`);
            } else if (response.status === 403) {
                // More specific 403 error handling
                if (errorData.error && errorData.error.message) {
                    if (errorData.error.message.includes('insufficient authentication scopes')) {
                        throw new Error(`권한 오류 (403): Google Calendar API 스코프가 부족합니다. 설정에서 다시 인증해주세요.`);
                    } else if (errorData.error.message.includes('Calendar API has not been used')) {
                        throw new Error(`권한 오류 (403): Google Calendar API가 활성화되지 않았습니다. Chrome 확장 프로그램용 OAuth 클라이언트 설정이 필요합니다. 설정에서 "Google Calendar 인증"을 다시 시도해주세요.`);
                    } else if (errorData.error.message.includes('API has not been used')) {
                        throw new Error(`권한 오류 (403): Google Calendar API가 활성화되지 않았습니다. Google Cloud Console에서 Calendar API를 활성화하고 Chrome 확장 프로그램용 OAuth 클라이언트를 설정해주세요.`);
                    } else if (errorData.error.message.includes('insufficient authentication scopes')) {
                        throw new Error(`권한 오류 (403): 인증 스코프가 부족합니다. 설정에서 "Google Calendar 인증"을 다시 시도해주세요.`);
                    } else if (errorData.error.message.includes('access_denied')) {
                        throw new Error(`권한 오류 (403): 접근이 거부되었습니다. Google 계정에서 Calendar API 접근을 허용해주세요.`);
                    }
                }
                throw new Error(`권한 오류 (403): Google Calendar API에 대한 권한이 없습니다. Google Cloud Console에서 Calendar API를 활성화하고 OAuth 클라이언트를 설정해주세요.`);
            } else {
                throw new Error(errorMessage);
            }
        }

        const responseData = await response.json();
        console.log('Google Calendar API 응답 성공:', responseData);
        return responseData;
    }

    async getPrimaryCalendar() {
        try {
            const calendars = await this.makeRequest('/users/me/calendarList');
            const primaryCalendar = calendars.items.find(cal => cal.primary);
            
            if (!primaryCalendar) {
                throw new Error('기본 캘린더를 찾을 수 없습니다.');
            }

            return primaryCalendar;
        } catch (error) {
            console.error('기본 캘린더 조회 오류:', error);
            throw error;
        }
    }

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

    // Filter valid attendee emails
    filterValidAttendees(attendees) {
        if (!Array.isArray(attendees)) {
            console.log('참석자가 배열이 아님, 빈 배열 반환');
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
                console.log('유효한 참석자 추가:', email);
            } else {
                console.log('유효하지 않은 이메일 제외:', email);
            }
        }
        
        console.log('필터링된 참석자 수:', validAttendees.length);
        return validAttendees;
    }

    // Email validation
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

    // Improve description formatting
    improveDescriptionFormatting(description) {
        console.log('=== improveDescriptionFormatting 호출됨 ===');
        console.log('입력 description:', description);
        
        if (!description || typeof description !== 'string') {
            console.log('유효하지 않은 description, 원본 반환');
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
        
        console.log('개선된 description:', improved);
        console.log('=== improveDescriptionFormatting 완료 ===');
        
        return improved;
    }

    async checkDuplicateEvent(calendarId, eventData) {
        try {
            const startTime = new Date(eventData.start.dateTime);
            const endTime = new Date(eventData.end.dateTime);
            
            // Set time range wider (30 minutes before/after)
            const timeMin = new Date(startTime.getTime() - 30 * 60 * 1000).toISOString();
            const timeMax = new Date(endTime.getTime() + 30 * 60 * 1000).toISOString();

            const events = await this.makeRequest(
                `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`
            );

            // Check if there's an event with the same title
            const duplicateTitle = events.items.find(event => 
                event.summary && event.summary.toLowerCase() === eventData.summary.toLowerCase()
            );

            return duplicateTitle !== undefined;
        } catch (error) {
            console.error('중복 일정 확인 오류:', error);
            return false;
        }
    }

    async createEvent(calendarId, eventData) {
        try {
            const result = await this.makeRequest(
                `/calendars/${encodeURIComponent(calendarId)}/events`,
                {
                    method: 'POST',
                    body: JSON.stringify(eventData)
                }
            );

            return result;
        } catch (error) {
            console.error('일정 생성 오류:', error);
            throw error;
        }
    }
}

// Module instances
let GeminiAPIInstance = GeminiAPI;
let GoogleCalendarAPIInstance = GoogleCalendarAPI;

// LLM instance factory function
function createLLMInstance(llmType, apiKey) {
    switch (llmType) {
        case 'gemini':
            return new GeminiAPIInstance(apiKey);
        case 'claude':
            return new ClaudeAPI(apiKey);
        case 'chatgpt':
            return new ChatGPTAPI(apiKey);
        default:
            throw new Error(`지원하지 않는 LLM 타입: ${llmType}`);
    }
}

// Check module loading
function checkModules() {
    console.log('모듈 로드 상태 확인:');
    console.log('- GeminiAPI:', typeof GeminiAPIInstance);
    console.log('- GoogleCalendarAPI:', typeof GoogleCalendarAPIInstance);
}

// Extension installation/update initialization
chrome.runtime.onInstalled.addListener((details) => {
    console.log('ContextClipCalendar 확장 프로그램이 설치되었습니다:', details.reason);
    
    // Check module loading
    checkModules();
    
    // Initialize default settings
    initializeDefaultSettings();
    
    // Create context menus
    createContextMenus();
});

// Initialize default settings
async function initializeDefaultSettings() {
    const defaultSettings = {
        selectedLLM: 'gemini', // Default: Gemini
        geminiApiKey: '',
        isFirstRun: true
    };
    
    try {
        const currentSettings = await chrome.storage.local.get();
        
        // Initialize with default values if no existing settings
        if (Object.keys(currentSettings).length === 0) {
            await chrome.storage.local.set(defaultSettings);
            console.log('기본 설정이 초기화되었습니다.');
        } else {
            // Add new fields to existing settings (migration)
            const updatedSettings = { ...defaultSettings, ...currentSettings };
            await chrome.storage.local.set(updatedSettings);
            console.log('설정이 업데이트되었습니다.');
        }
    } catch (error) {
        console.error('설정 초기화 오류:', error);
    }
}

// Create context menus
function createContextMenus() {
    // Remove existing menus
    chrome.contextMenus.removeAll(() => {
        // Create main menu
        chrome.contextMenus.create({
            id: 'contextclip-main',
            title: 'ContextClipCalendar',
            contexts: ['selection']
        });
        
        // Create sub-menus
        chrome.contextMenus.create({
            id: 'contextclip-calendar',
            parentId: 'contextclip-main',
            title: '📅 일정 등록',
            contexts: ['selection']
        });
    });
}

// Context menu click event handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!info.selectionText) return;
    
    const selectedText = info.selectionText.trim();
    
    switch (info.menuItemId) {
        case 'contextclip-calendar':
            await handleCalendarAction(selectedText, tab);
            break;
    }
});

// Message communication handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Wrap in Promise for async processing
    handleMessage(request, sender).then(sendResponse);
    return true; // Return true for async response
});

// Message handling function
async function handleMessage(request, sender) {
    try {
        switch (request.action) {
            case 'createCalendarEvent':
                // Handle both old format (text) and new format (eventData)
                if (request.eventData) {
                    return await handleCreateCalendarEventFromSidePanel(request.eventData);
                } else {
                    return await handleCalendarAction(request.text, sender.tab);
                }
                
            case 'analyzeCalendarText':
                return await handleAnalyzeCalendarText(request.text, request.source);
                
            case 'sendToSidePanel':
                return await handleSendToSidePanel(request.data);
                
            case 'getSettings':
                return await getSettings();
                
            case 'saveSettings':
                return await saveSettings(request.settings);
                
            case 'validateGoogleToken':
                return await validateAndRefreshToken(request.accessToken, request.refreshToken);
                
            case 'testGeminiAPI':
                return await testGeminiAPI(request.apiKey);
                
            case 'testClaudeAPI':
                return await testClaudeAPI(request.apiKey);
                
            case 'testChatgptAPI':
                return await testChatgptAPI(request.apiKey);
                
            case 'authenticateGoogle':
                return await authenticateGoogle();
                
            case 'checkGoogleTokenStatus':
                return await checkGoogleTokenStatus();
                
            case 'revokeGoogleAuth':
                return await revokeGoogleAuth();
                
            case 'checkChromeStoreOAuthStatus':
                return await checkChromeStoreOAuthStatus();
                
            case 'getOAuthSetupGuide':
                return await getOAuthSetupGuide();
                
            case 'validateOAuthClient':
                return await validateOAuthClient();
                
            default:
                return { success: false, error: '알 수 없는 액션' };
        }
    } catch (error) {
        console.error('메시지 처리 오류:', error);
        return { success: false, error: error.message };
    }
}

// Handle analyze calendar text (for side panel)
async function handleAnalyzeCalendarText(text, source) {
    try {
        console.log('일정 분석 시작:', { textLength: text.length, source });
        
        // Get settings
        const settings = await getSettings();
        
        // Get selected LLM
        const selectedLLM = settings.selectedLLM || 'gemini';
        console.log('사용할 LLM:', selectedLLM);
        
        // Get API key based on selected LLM
        let apiKey = '';
        switch (selectedLLM) {
            case 'gemini':
                apiKey = settings.geminiApiKey;
                break;
            case 'claude':
                apiKey = settings.claudeApiKey;
                break;
            case 'chatgpt':
                apiKey = settings.chatgptApiKey;
                break;
        }
        
        if (!apiKey) {
            return { 
                success: false, 
                error: `${selectedLLM.toUpperCase()} API 키가 설정되지 않았습니다.` 
            };
        }
        
        // Create LLM instance
        const llm = createLLMInstance(selectedLLM, apiKey);
        
        // Extract calendar information using LLM
        try {
            const calendarData = await llm.extractCalendarInfo(text);
            console.log('LLM 분석 결과:', calendarData);
            
            // Check if it's multiple events (array) or single event (object)
            if (Array.isArray(calendarData)) {
                // Multiple events
                console.log('복수 일정 감지:', calendarData.length, '개');
                
                // Validate each event
                const validEvents = calendarData.filter(event => 
                    event && event.title && event.title !== '새로운 일정'
                );
                
                if (validEvents.length === 0) {
                    throw new Error('제공된 텍스트에서 유효한 일정 정보를 추출할 수 없습니다.');
                }
                
                // Return multiple events for side panel
                return { 
                    success: true, 
                    data: validEvents,
                    isMultiple: true
                };
            } else {
                // Single event
                console.log('단일 일정 감지');
                
                // Validate calendar info
                if (!calendarData || !calendarData.title || calendarData.title === '새로운 일정') {
                    throw new Error('제공된 텍스트에서 일정 정보를 추출할 수 없습니다.');
                }
                
                // Return single event for side panel
                return { 
                    success: true, 
                    data: calendarData,
                    isMultiple: false
                };
            }
            
        } catch (extractError) {
            console.error('일정 정보 추출 실패:', extractError);
            
            // Special response for calendar info extraction failure
            if (extractError.message.includes('일정 정보를 추출할 수 없습니다')) {
                return {
                    success: false,
                    error: 'extract_failed',
                    message: '제공된 텍스트에서 일정 정보를 추출할 수 없습니다.',
                    details: '텍스트에 날짜, 시간, 일정 제목 등의 정보가 포함되어 있는지 확인해주세요.'
                };
            }
            
            // Handle other errors with general error message
            return { 
                success: false, 
                error: extractError.message 
            };
        }
        
    } catch (error) {
        console.error('일정 분석 처리 오류:', error);
        return { success: false, error: error.message };
    }
}

// Handle send data to side panel
async function handleSendToSidePanel(data) {
    try {
        console.log('사이드 패널로 데이터 전달:', data);
        
        // Get current window
        const currentWindow = await chrome.windows.getCurrent();
        
        // Store data for side panel to retrieve
        await chrome.storage.local.set({ 
            pendingSidePanelData: data,
            pendingSidePanelTimestamp: Date.now()
        });
        
        console.log('데이터가 사이드 패널로 전달되었습니다.');
        return { success: true };
        
    } catch (error) {
        console.error('사이드 패널 데이터 전달 오류:', error);
        return { success: false, error: error.message };
    }
}

// Global flag to prevent duplicate event creation
let isCreatingEvent = false;

// Handle create calendar event from side panel
async function handleCreateCalendarEventFromSidePanel(eventData) {
    console.log('=== BACKGROUND.JS: handleCreateCalendarEventFromSidePanel called ===');
    console.log('isCreatingEvent:', isCreatingEvent);
    
    if (isCreatingEvent) {
        console.log('=== BACKGROUND.JS: Event creation already in progress, ignoring duplicate request ===');
        return { 
            success: false, 
            error: '일정 생성이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.' 
        };
    }
    
    isCreatingEvent = true;
    console.log('=== BACKGROUND.JS: Setting isCreatingEvent to true ===');
    
    try {
        console.log('사이드 패널에서 일정 생성:', eventData);
        
        // Check Google Calendar access token
        const { googleAccessToken } = await chrome.storage.local.get(['googleAccessToken']);
        if (!googleAccessToken) {
            return { 
                success: false, 
                error: 'Google Calendar 인증이 필요합니다. 설정에서 "Google Calendar 인증"을 다시 시도해주세요.' 
            };
        }
        
        // Validate and refresh token
        const validToken = await validateAndRefreshToken(googleAccessToken, null);
        if (!validToken) {
            return { 
                success: false, 
                error: 'Google Calendar 인증이 만료되었습니다. 설정에서 다시 인증해주세요.' 
            };
        }
        
        // Create Google Calendar event
        const result = await createGoogleCalendarEvent(eventData, validToken);
        console.log('Google Calendar 등록 결과:', result);
        
        let message = '일정이 성공적으로 등록되었습니다!';
        if (result.isDuplicate) {
            message = '일정이 등록되었습니다. (동일한 제목의 일정이 이미 존재할 수 있습니다.)';
        }
        
        return { 
            success: true, 
            message: message,
            data: result 
        };
        
    } catch (error) {
        console.error('사이드 패널 일정 생성 오류:', error);
        return { success: false, error: error.message };
    } finally {
        isCreatingEvent = false;
        console.log('=== BACKGROUND.JS: Setting isCreatingEvent to false ===');
    }
}

// Handle calendar action with fallback to API key method
async function handleCalendarAction(text, apiKey) {
    try {
        console.log('일정 등록 처리 시작:', { textLength: text.length, sourceUrl: undefined });
        
        // First try Chrome Web Store OAuth
        try {
            const oauthResult = await handleCalendarActionWithOAuth(text, apiKey);
            if (oauthResult.success) {
                return oauthResult;
            }
            
            // If OAuth fails with specific error, try API key method
            if (oauthResult.code === 'CHROME_STORE_OAUTH_PENDING') {
                console.log('Chrome Web Store OAuth 미완료, API 키 방식으로 시도');
                return await handleCalendarActionWithAPIKey(text, apiKey);
            }
            
            return oauthResult;
            
        } catch (oauthError) {
            console.log('OAuth 방식 실패, API 키 방식으로 시도:', oauthError.message);
            return await handleCalendarActionWithAPIKey(text, apiKey);
        }
        
    } catch (error) {
        console.error('일정 등록 처리 오류:', error);
        return { success: false, error: error.message };
    }
}

// Handle calendar action with OAuth (existing method)
async function handleCalendarActionWithOAuth(text, apiKey) {
    try {
        console.log('일정 등록 처리 시작 (OAuth 방식):', { textLength: text.length });
        
        // Check settings
        const settings = await getSettings();
        
        // Check Gemini API key
        const llmApiKey = settings.geminiApiKey || apiKey;
        
        if (!llmApiKey) {
            return { success: false, error: 'Gemini API 키가 설정되지 않았습니다.' };
        }
        
        // Check and refresh Google Calendar access token
        const { googleAccessToken, googleRefreshToken } = await chrome.storage.local.get(['googleAccessToken', 'googleRefreshToken']);
        if (!googleAccessToken) {
            // Try to get token using Chrome Identity API (recommended for Chrome extensions)
            try {
                const token = await new Promise((resolve, reject) => {
                    chrome.identity.getAuthToken({ 
                        interactive: true
                    }, (token) => {
                        if (chrome.runtime.lastError) {
                            console.error('Chrome Identity API 오류:', chrome.runtime.lastError);
                            reject(new Error(chrome.runtime.lastError.message));
                        } else if (token) {
                            resolve(token);
                        } else {
                            reject(new Error('인증이 취소되었습니다.'));
                        }
                    });
                });
                
                // Save the new token
                await chrome.storage.local.set({
                    googleAccessToken: token
                });
                
                console.log('Chrome Identity API를 통해 토큰 획득 완료');
                
            } catch (oauthError) {
                console.error('Chrome Identity API 오류:', oauthError);
                return { 
                    success: false, 
                    error: 'Google Calendar 인증이 필요합니다. 설정 페이지에서 "Google Calendar 인증" 버튼을 클릭하여 인증을 진행해주세요.',
                    details: oauthError.message,
                    action: 'authenticate'
                };
            }
        }
        
        // Get the token again (either existing or newly acquired)
        const { googleAccessToken: currentToken } = await chrome.storage.local.get(['googleAccessToken']);
        if (!currentToken) {
            return { success: false, error: 'Google Calendar 인증이 필요합니다. 설정에서 "Google Calendar 인증"을 다시 시도해주세요.' };
        }
        
        // Validate and refresh token
        const validToken = await validateAndRefreshToken(currentToken, googleRefreshToken);
        if (!validToken) {
            return { success: false, error: 'Google Calendar 인증이 만료되었습니다. 설정에서 다시 인증해주세요.' };
        }
        
        console.log('인증 확인 완료, LLM 분석 시작');
        
        // Extract calendar information using LLM
        try {
            const calendarData = await extractCalendarData(text, llmApiKey);
            console.log('LLM 분석 결과:', calendarData);
            
            // Integrate with Google Calendar API
            const result = await createGoogleCalendarEvent(calendarData, currentToken);
            console.log('Google Calendar 등록 결과:', result);
            
            let message = '일정이 성공적으로 등록되었습니다!';
            if (result.isDuplicate) {
                message = '일정이 등록되었습니다. (동일한 제목의 일정이 이미 존재할 수 있습니다.)';
            }
            
            return { 
                success: true, 
                message: message,
                data: result 
            };
        } catch (extractError) {
            console.error('일정 정보 추출 실패:', extractError);
            
            // Special response for calendar info extraction failure
            if (extractError.message.includes('일정 정보를 추출할 수 없습니다')) {
                return {
                    success: false,
                    error: 'extract_failed',
                    message: '제공된 텍스트에서 일정 정보를 추출할 수 없습니다.',
                    details: '텍스트에 날짜, 시간, 일정 제목 등의 정보가 포함되어 있는지 확인해주세요.'
                };
            }
            
            // Handle other errors with general error message
            return { 
                success: false, 
                error: extractError.message 
            };
        }
    } catch (error) {
        console.error('일정 등록 처리 오류:', error);
        return { success: false, error: error.message };
    }
}

// Handle calendar action with API key (new method)
async function handleCalendarActionWithAPIKey(text, apiKey) {
    try {
        console.log('일정 등록 처리 시작 (API 키 방식):', { textLength: text.length });
        
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, error: 'API 키가 비어있습니다.' };
        }
        
        // Create Gemini API instance
        const llm = createLLMInstance('gemini', apiKey.trim());
        
        // Extract calendar information using LLM
        try {
            const calendarData = await llm.extractCalendarInfo(text);
            console.log('LLM 분석 결과 (API 키 방식):', calendarData);
            
            // Validate calendar info
            if (!calendarData || !calendarData.title || calendarData.title === '새로운 일정') {
                throw new Error('제공된 텍스트에서 일정 정보를 추출할 수 없습니다.');
            }
            
            // Create Google Calendar event
            const result = await createGoogleCalendarEvent(calendarData, null); // No access token for API key method
            console.log('Google Calendar 등록 결과 (API 키 방식):', result);
            
            let message = '일정이 성공적으로 등록되었습니다!';
            if (result.isDuplicate) {
                message = '일정이 등록되었습니다. (동일한 제목의 일정이 이미 존재할 수 있습니다.)';
            }
            
            return { 
                success: true, 
                message: message,
                data: result 
            };
        } catch (extractError) {
            console.error('일정 정보 추출 실패 (API 키 방식):', extractError);
            
            // Special response for calendar info extraction failure
            if (extractError.message.includes('일정 정보를 추출할 수 없습니다')) {
                return {
                    success: false,
                    error: 'extract_failed',
                    message: '제공된 텍스트에서 일정 정보를 추출할 수 없습니다.',
                    details: '텍스트에 날짜, 시간, 일정 제목 등의 정보가 포함되어 있는지 확인해주세요.'
                };
            }
            
            // Handle other errors with general error message
            return { 
                success: false, 
                error: extractError.message 
            };
        }
    } catch (error) {
        console.error('일정 등록 처리 오류 (API 키 방식):', error);
        return { success: false, error: error.message };
    }
}

// Create Google Calendar event (improved version)
async function createGoogleCalendarEvent(calendarData, accessToken) {
    try {
        console.log('Google Calendar 일정 생성 시작:', calendarData);
        
        if (!GoogleCalendarAPIInstance) {
            throw new Error('GoogleCalendarAPI 모듈이 로드되지 않았습니다.');
        }
        const calendar = new GoogleCalendarAPIInstance(accessToken);
        
        // Get primary calendar info
        const primaryCalendar = await calendar.getPrimaryCalendar();
        const calendarId = primaryCalendar.id;
        console.log('사용할 캘린더 ID:', calendarId);
        
        // Format event data
        const eventData = calendar.formatEventData(calendarData);
        console.log('포맷된 일정 데이터:', eventData);
        
        // Create event (duplicate check handled internally in createEvent)
        const result = await calendar.createEvent(calendarId, eventData);
        
        console.log('일정 생성 결과:', result);
        
        return {
            eventId: result.id,
            summary: result.summary,
            startTime: result.start.dateTime,
            endTime: result.end.dateTime,
            htmlLink: result.htmlLink,
            isDuplicate: result.isDuplicate || false,
            location: result.location || '',
            description: result.description || ''
        };
    } catch (error) {
        console.error('Google Calendar 일정 생성 오류:', error);
        throw error;
    }
}

// Get settings
async function getSettings() {
    try {
        const result = await chrome.storage.local.get();
        return result;
    } catch (error) {
        console.error('설정 가져오기 오류:', error);
        return {};
    }
}

// Save settings
async function saveSettings(settings) {
    try {
        await chrome.storage.local.set(settings);
        return { success: true };
    } catch (error) {
        console.error('설정 저장 오류:', error);
        return { success: false, error: error.message };
    }
}

// LLM related functions (improved version)
async function extractCalendarData(text, apiKey) {
    try {
        // Get Gemini API key from settings
        const settings = await getSettings();
        const llmApiKey = settings.geminiApiKey || apiKey;
        
        console.log('사용할 LLM: Gemini');
        
        if (!llmApiKey) {
            throw new Error('Gemini API 키가 설정되지 않았습니다.');
        }
        
        // Create LLM instance
        const llm = createLLMInstance('gemini', llmApiKey);
        
        console.log('일정 데이터 추출 시작');
        
        // Step 1: Basic calendar info extraction
        const calendarInfo = await llm.extractCalendarInfo(text);
        console.log('기본 일정 정보 추출 완료:', calendarInfo);
        
        // Validate calendar info
        if (!calendarInfo || !calendarInfo.title || calendarInfo.title === '새로운 일정') {
            throw new Error('제공된 텍스트에서 일정 정보를 추출할 수 없습니다.');
        }
        
        // Step 2: Detailed analysis (optional)
        try {
            const detailedAnalysis = await llm.analyzeCalendarText(text);
            console.log('상세 분석 완료:', detailedAnalysis);
            
            // Merge detailed analysis results with basic info
            const enhancedInfo = {
                ...calendarInfo,
                eventType: detailedAnalysis.eventType || 'meeting',
                priority: detailedAnalysis.priority || 'normal',
                confidence: detailedAnalysis.confidence || 0.5,
                // Improve attendee info (allow only valid emails)
                attendees: llm.mergeAndValidateAttendees(
                    calendarInfo.attendees || [],
                    detailedAnalysis.participants?.emails || []
                ),
                // Improve location info (safe access)
                location: (detailedAnalysis.location && (
                    detailedAnalysis.location.address || 
                    detailedAnalysis.location.room || 
                    detailedAnalysis.location.platform
                )) || calendarInfo.location
            };
            
            console.log('향상된 일정 정보:', enhancedInfo);
            return enhancedInfo;
        } catch (analysisError) {
            console.warn('상세 분석 실패, 기본 정보만 사용:', analysisError.message);
            return calendarInfo;
        }
    } catch (error) {
        console.error('일정 데이터 추출 오류:', error);
        throw error; // Re-throw error for handling upstream
    }
}

async function generateSummary(text, apiKey) {
    try {
        // Get Gemini API key from settings
        const settings = await getSettings();
        const llmApiKey = settings.geminiApiKey || apiKey;
        
        console.log('요약 생성에 사용할 LLM: Gemini');
        
        if (!llmApiKey) {
            throw new Error('Gemini API 키가 설정되지 않았습니다.');
        }
        
        // Create LLM instance
        const llm = createLLMInstance('gemini', llmApiKey);
        const summary = await llm.generateSummary(text, 200);
        return summary;
    } catch (error) {
        console.error('요약 생성 오류:', error);
        // Return basic summary on error
        return `요약: ${text.substring(0, 100)}...`;
    }
}

// Google OAuth token validation and refresh
async function validateAndRefreshToken(accessToken, refreshToken) {
    try {
        console.log('토큰 유효성 검사 시작');
        
        // Test current token with a simple API call first
        const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
        
        if (testResponse.ok) {
            const tokenInfo = await testResponse.json();
            console.log('토큰이 유효합니다:', tokenInfo);
            
            // Check if token has required scopes
            const requiredScopes = [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly'
            ];
            
            const hasRequiredScopes = requiredScopes.some(scope => 
                tokenInfo.scope && tokenInfo.scope.includes(scope)
            );
            
            if (!hasRequiredScopes) {
                console.log('토큰에 필요한 스코프가 없습니다. 토큰 갱신이 필요합니다.');
                // Fall through to token refresh
            } else {
                return accessToken;
            }
        }
        
        // Try to get a fresh token using Chrome Identity API
        console.log('토큰 갱신 시도');
        try {
            const freshToken = await new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ 
                    interactive: true,
                    scopes: SCOPES // Show UI to ensure proper scopes
                }, (token) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (token) {
                        resolve(token);
                    } else {
                        reject(new Error('토큰 갱신 실패'));
                    }
                });
            });
            
            if (freshToken) {
                console.log('토큰 갱신 성공');
                // Save the new token
                await chrome.storage.local.set({
                    googleAccessToken: freshToken
                });
                return freshToken;
            }
        } catch (refreshError) {
            console.log('자동 토큰 갱신 실패:', refreshError.message);
        }
        
        console.log('토큰 갱신 실패');
        return null;
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        return null;
    }
}

// Test Gemini API key
async function testGeminiAPI(apiKey) {
    try {
        console.log('Gemini API 키 테스트 시작');
        
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, error: 'API 키가 비어있습니다.' };
        }
        
        // Create Gemini API instance
        const gemini = new GeminiAPI(apiKey.trim());
        
        // Call API with simple test prompt
        const testPrompt = '안녕하세요. 이것은 API 키 테스트입니다. "테스트 성공"이라고만 응답해주세요.';
        
        const response = await gemini.callAPI(testPrompt, { 
            temperature: 0.1,
            maxTokens: 50 
        });
        
        console.log('Gemini API 테스트 응답:', response);
        
        // Check if response exists and is valid
        if (response && typeof response === 'string' && response.trim().length > 0) {
            // Check if response contains "테스트" or "성공" keywords
            const responseText = response.toLowerCase().trim();
            if (responseText.includes('테스트') || responseText.includes('성공')) {
                return { success: true, message: 'API 키가 유효합니다.' };
            } else {
                // Even if expected keywords are missing, treat as success if API is working
                console.log('응답에 예상 키워드가 없지만 API가 정상 작동함:', response);
                return { success: true, message: 'API 키가 유효합니다.' };
            }
        } else {
            return { success: false, error: 'API 응답이 비어있습니다.' };
        }
        
    } catch (error) {
        console.error('Gemini API 테스트 오류:', error);
        
        // Provide specific error messages
        let errorMessage = 'API 키 테스트 실패';
        
        if (error.message.includes('400')) {
            errorMessage = 'API 키가 유효하지 않습니다. 올바른 API 키를 입력해주세요.';
        } else if (error.message.includes('401')) {
            errorMessage = 'API 키 인증에 실패했습니다. API 키를 확인해주세요.';
        } else if (error.message.includes('403')) {
            errorMessage = 'API 키에 권한이 없습니다. API 키를 확인해주세요.';
        } else if (error.message.includes('429')) {
            errorMessage = 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('500')) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
        } else {
            errorMessage = `API 키 테스트 실패: ${error.message}`;
        }
        
        return { success: false, error: errorMessage };
    }
}

// Test Claude API key
async function testClaudeAPI(apiKey) {
    try {
        console.log('Claude API 키 테스트 시작');
        
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, error: 'API 키가 비어있습니다.' };
        }
        
        // Create Claude API instance
        const claude = new ClaudeAPI(apiKey.trim());
        
        // Call API with simple test prompt
        const testPrompt = '안녕하세요. 이것은 API 키 테스트입니다. "테스트 성공"이라고만 응답해주세요.';
        
        const response = await claude.callAPI(testPrompt, { 
            temperature: 0.1,
            maxTokens: 50 
        });
        
        console.log('Claude API 테스트 응답:', response);
        
        // Check if response exists and is valid
        if (response && typeof response === 'string' && response.trim().length > 0) {
            // Check if response contains "테스트" or "성공" keywords
            if (response.includes('테스트') || response.includes('성공')) {
                return { 
                    success: true, 
                    message: 'Claude API 키가 유효합니다!',
                    response: response.trim()
                };
            } else {
                return { 
                    success: true, 
                    message: 'Claude API 키가 유효합니다! (응답: ' + response.trim() + ')',
                    response: response.trim()
                };
            }
        } else {
            return { success: false, error: 'API 응답이 비어있거나 올바르지 않습니다.' };
        }
        
    } catch (error) {
        console.error('Claude API 테스트 오류:', error);
        
        // Provide specific error messages
        let errorMessage = 'API 키 테스트 실패';
        
        if (error.message.includes('400')) {
            errorMessage = 'API 키가 유효하지 않습니다. 올바른 API 키를 입력해주세요.';
        } else if (error.message.includes('401')) {
            errorMessage = 'API 키 인증에 실패했습니다. API 키를 확인해주세요.';
        } else if (error.message.includes('403')) {
            errorMessage = 'API 키에 권한이 없습니다. API 키를 확인해주세요.';
        } else if (error.message.includes('429')) {
            errorMessage = 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('500')) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
        } else {
            errorMessage = `API 키 테스트 실패: ${error.message}`;
        }
        
        return { success: false, error: errorMessage };
    }
}

// Test ChatGPT API key
async function testChatgptAPI(apiKey) {
    try {
        console.log('ChatGPT API 키 테스트 시작');
        
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, error: 'API 키가 비어있습니다.' };
        }
        
        // Create ChatGPT API instance
        const chatgpt = new ChatGPTAPI(apiKey.trim());
        
        // Call API with simple test prompt
        const testPrompt = '안녕하세요. 이것은 API 키 테스트입니다. "테스트 성공"이라고만 응답해주세요.';
        
        const response = await chatgpt.callAPI(testPrompt, { 
            temperature: 0.1,
            maxTokens: 50 
        });
        
        console.log('ChatGPT API 테스트 응답:', response);
        
        // Check if response exists and is valid
        if (response && typeof response === 'string' && response.trim().length > 0) {
            // Check if response contains "테스트" or "성공" keywords
            if (response.includes('테스트') || response.includes('성공')) {
                return { 
                    success: true, 
                    message: 'ChatGPT API 키가 유효합니다!',
                    response: response.trim()
                };
            } else {
                return { 
                    success: true, 
                    message: 'ChatGPT API 키가 유효합니다! (응답: ' + response.trim() + ')',
                    response: response.trim()
                };
            }
        } else {
            return { success: false, error: 'API 응답이 비어있거나 올바르지 않습니다.' };
        }
        
    } catch (error) {
        console.error('ChatGPT API 테스트 오류:', error);
        
        // Provide specific error messages
        let errorMessage = 'API 키 테스트 실패';
        
        if (error.message.includes('400')) {
            errorMessage = 'API 키가 유효하지 않습니다. 올바른 API 키를 입력해주세요.';
        } else if (error.message.includes('401')) {
            errorMessage = 'API 키 인증에 실패했습니다. API 키를 확인해주세요.';
        } else if (error.message.includes('403')) {
            errorMessage = 'API 키에 권한이 없습니다. API 키를 확인해주세요.';
        } else if (error.message.includes('429')) {
            errorMessage = 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('500')) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
        } else {
            errorMessage = `API 키 테스트 실패: ${error.message}`;
        }
        
        return { success: false, error: errorMessage };
    }
}

// Web OAuth configuration - Use manifest.json oauth2 settings
const EXTENSION_REDIRECT = `https://${chrome.runtime.id}.chromiumapp.org/`;
const SCOPES = [
    'openid',
    'email', 
    'profile',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
];

// Google OAuth authentication function using Chrome Identity API
async function authenticateGoogle() {
    try {
        console.log('Google OAuth 인증 시작 (Chrome Identity API)');
        return await authenticateGoogleChromeIdentity();
        
    } catch (error) {
        console.error('Google OAuth 인증 오류:', error);
        return { success: false, error: error.message };
    }
}

// Chrome Identity API authentication function
async function authenticateGoogleChromeIdentity() {
    try {
        console.log('Chrome Identity API 인증 시작');
        
        // Get OAuth client ID from manifest
        const manifest = chrome.runtime.getManifest();
        const clientId = manifest.oauth2?.client_id;
        
        if (!clientId) {
            throw new Error('OAuth 클라이언트 ID가 manifest.json에 설정되지 않았습니다.');
        }
        
        // Use Chrome Identity API to get auth token
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 
                interactive: true,
                scopes: SCOPES
            }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome Identity API 오류:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (token) {
                    resolve(token);
                } else {
                    reject(new Error('인증이 취소되었습니다.'));
                }
            });
        });
        
        if (!token) {
            throw new Error('토큰을 받지 못했습니다.');
        }
        
        // Test the token with Calendar API
        try {
            const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!testResponse.ok) {
                const errorData = await testResponse.json();
                console.error('토큰 테스트 실패:', errorData);
                throw new Error(`토큰 테스트 실패: ${testResponse.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
            }
            
            console.log('토큰 테스트 성공');
        } catch (testError) {
            console.error('토큰 테스트 오류:', testError);
            throw new Error(`토큰 유효성 검사 실패: ${testError.message}`);
        }
        
        // Save token
        await chrome.storage.local.set({
            googleAccessToken: token
        });
        
        console.log('Chrome Identity API 인증 성공');
        return { success: true, message: 'Google 인증이 완료되었습니다.', accessToken: token };
        
    } catch (error) {
        console.error('Chrome Identity API 인증 오류:', error);
        
        // Provide specific error messages
        if (error.message.includes('access_denied')) {
            return { 
                success: false, 
                error: '사용자가 인증을 거부했습니다. 다시 시도해주세요.'
            };
        } else if (error.message.includes('invalid_client')) {
            return { 
                success: false, 
                error: 'OAuth 클라이언트 ID가 유효하지 않습니다. manifest.json의 클라이언트 ID를 확인해주세요.',
                solution: 'Google Cloud Console에서 올바른 클라이언트 ID를 확인하고 manifest.json을 업데이트해주세요.'
            };
        } else if (error.message.includes('API has not been used')) {
            return {
                success: false,
                error: 'Google Calendar API가 활성화되지 않았습니다.',
                solution: 'Google Cloud Console > APIs & Services > Library에서 "Google Calendar API"를 검색하고 활성화해주세요.'
            };
        }
        
        return { success: false, error: error.message };
    }
}

// Web OAuth Flow function for web application client (deprecated)
async function authenticateGoogleWebFlow() {
    try {
        console.log('Web OAuth Flow 시작');
        
        // Get OAuth client ID from manifest
        const manifest = chrome.runtime.getManifest();
        const clientId = manifest.oauth2?.client_id;
        
        if (!clientId) {
            throw new Error('OAuth 클라이언트 ID가 manifest.json에 설정되지 않았습니다.');
        }
        
        // Build OAuth URL with proper scopes
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', EXTENSION_REDIRECT);
        authUrl.searchParams.set('response_type', 'code'); // Authorization Code Flow
        authUrl.searchParams.set('scope', SCOPES.join(' '));
        authUrl.searchParams.set('include_granted_scopes', 'true');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('access_type', 'offline');
        
        console.log('OAuth URL:', authUrl.toString());
        console.log('요청 스코프:', SCOPES);
        
        // Launch web auth flow
        const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true
        });
        
        console.log('OAuth redirect URL:', redirectUrl);
        
        // Parse authorization code from redirect URL
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
            throw new Error(`OAuth 오류: ${error}`);
        }
        
        if (!code) {
            throw new Error('인증 코드를 받지 못했습니다.');
        }
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: EXTENSION_REDIRECT
            })
        });
        
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            throw new Error(`토큰 교환 실패: ${tokenResponse.status} - ${errorData.error_description || errorData.error || '알 수 없는 오류'}`);
        }
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        
        if (!accessToken) {
            throw new Error('액세스 토큰을 받지 못했습니다.');
        }
        
        // Test the token with Calendar API
        try {
            const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!testResponse.ok) {
                const errorData = await testResponse.json();
                console.error('토큰 테스트 실패:', errorData);
                throw new Error(`토큰 테스트 실패: ${testResponse.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
            }
            
            console.log('토큰 테스트 성공');
        } catch (testError) {
            console.error('토큰 테스트 오류:', testError);
            throw new Error(`토큰 유효성 검사 실패: ${testError.message}`);
        }
        
        // Save tokens
        await chrome.storage.local.set({
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken
        });
        
        console.log('Web OAuth Flow 인증 성공');
        return { success: true, message: 'Google 인증이 완료되었습니다.', accessToken: accessToken };
        
    } catch (error) {
        console.error('Web OAuth Flow 인증 오류:', error);
        
        // Provide specific error messages for web application client
        if (error.message.includes('redirect_uri_mismatch')) {
            return { 
                success: false, 
                error: '리디렉션 URI 불일치 오류입니다. Google Cloud Console에서 리디렉션 URI가 올바르게 설정되어 있는지 확인해주세요.',
                details: '리디렉션 URI: ' + EXTENSION_REDIRECT,
                solution: 'Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs에서 리디렉션 URI를 추가해주세요.'
            };
        } else if (error.message.includes('access_denied')) {
            return { 
                success: false, 
                error: '사용자가 인증을 거부했습니다. 다시 시도해주세요.'
            };
        } else if (error.message.includes('invalid_client')) {
            return { 
                success: false, 
                error: 'OAuth 클라이언트 ID가 유효하지 않습니다. manifest.json의 클라이언트 ID를 확인해주세요.',
                solution: 'Google Cloud Console에서 올바른 클라이언트 ID를 확인하고 manifest.json을 업데이트해주세요.'
            };
        } else if (error.message.includes('API has not been used')) {
            return {
                success: false,
                error: 'Google Calendar API가 활성화되지 않았습니다.',
                solution: 'Google Cloud Console > APIs & Services > Library에서 "Google Calendar API"를 검색하고 활성화해주세요.'
            };
        }
        
        return { success: false, error: error.message };
    }
}

// Check Google token status
async function checkGoogleTokenStatus() {
    try {
        const { googleAccessToken } = await chrome.storage.local.get(['googleAccessToken']);
        
        if (!googleAccessToken) {
            return { isValid: false, message: '토큰이 없습니다.' };
        }
        
        // Validate token
        const validToken = await validateAndRefreshToken(googleAccessToken, null);
        
        if (validToken) {
            return { isValid: true, message: '토큰이 유효합니다.' };
        } else {
            return { isValid: false, message: '토큰이 만료되었습니다.' };
        }
        
    } catch (error) {
        console.error('토큰 상태 확인 오류:', error);
        return { isValid: false, error: error.message };
    }
}

// Revoke Google authentication
async function revokeGoogleAuth() {
    try {
        const { googleAccessToken } = await chrome.storage.local.get(['googleAccessToken']);
        
        if (googleAccessToken) {
            // Revoke token using Chrome Identity API
            await new Promise((resolve, reject) => {
                chrome.identity.removeCachedAuthToken({
                    token: googleAccessToken
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('토큰 캐시 제거 오류:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            });

            // Also revoke from Google
            try {
                await fetch(`https://oauth2.googleapis.com/revoke?token=${googleAccessToken}`, {
                    method: 'POST'
                });
            } catch (revokeError) {
                console.warn('Google 토큰 해제 오류:', revokeError.message);
            }
        }
        
        // Remove tokens from local storage
        await chrome.storage.local.remove(['googleAccessToken', 'googleRefreshToken']);
        
        return { success: true, message: 'Google 인증이 해제되었습니다.' };
        
    } catch (error) {
        console.error('Google 인증 해제 오류:', error);
        return { success: false, error: error.message };
    }
}

// Check Web OAuth status
async function checkChromeStoreOAuthStatus() {
    try {
        // Check if we have a stored access token
        const { googleAccessToken } = await chrome.storage.local.get(['googleAccessToken']);
        
        if (googleAccessToken) {
            // Validate token by making a test API call
            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + googleAccessToken);
                if (response.ok) {
                    return { 
                        success: true, 
                        hasToken: true, 
                        message: '웹 OAuth가 정상적으로 설정되었습니다.' 
                    };
                }
            } catch (tokenError) {
                console.log('토큰 유효성 검사 실패:', tokenError.message);
            }
        }
        
        return { 
            success: false, 
            hasToken: false, 
            error: '웹 OAuth 인증이 필요합니다.',
            code: 'WEB_OAUTH_REQUIRED',
            message: 'Google 계정 인증을 진행해주세요.'
        };
        
    } catch (error) {
        console.log('웹 OAuth 상태 확인:', error.message);
        
        return { 
            success: false, 
            hasToken: false, 
            error: error.message,
            code: 'OAUTH_CHECK_FAILED',
            message: 'OAuth 상태 확인에 실패했습니다.'
        };
    }
}

// OAuth Setup Guide function
async function getOAuthSetupGuide() {
    try {
        const manifest = chrome.runtime.getManifest();
        const clientId = manifest.oauth2?.client_id;
        const extensionId = chrome.runtime.id;
        
        const guide = {
            success: true,
            title: "Google Calendar API 설정 가이드",
            steps: [
                {
                    step: 1,
                    title: "Google Cloud Console 프로젝트 생성",
                    description: "Google Cloud Console에서 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.",
                    url: "https://console.cloud.google.com/projectcreate"
                },
                {
                    step: 2,
                    title: "Google Calendar API 활성화",
                    description: "APIs & Services > Library에서 'Google Calendar API'를 검색하고 활성화합니다.",
                    url: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                },
                {
                    step: 3,
                    title: "OAuth 2.0 클라이언트 ID 생성",
                    description: "APIs & Services > Credentials에서 'OAuth 2.0 Client IDs'를 생성합니다.",
                    url: "https://console.cloud.google.com/apis/credentials"
                },
                {
                    step: 4,
                    title: "애플리케이션 유형 설정",
                    description: "애플리케이션 유형을 'Chrome 앱'으로 선택합니다.",
                    details: "Chrome 확장 프로그램에서는 'Chrome 앱'을 선택해야 합니다. Chrome Identity API를 사용하기 위해서입니다."
                },
                {
                    step: 5,
                    title: "애플리케이션 ID 설정",
                    description: "애플리케이션 ID에 확장 프로그램 ID를 입력합니다.",
                    details: `현재 확장 프로그램 ID: ${extensionId}`,
                    code: extensionId
                },
                {
                    step: 6,
                    title: "리디렉션 URI 설정",
                    description: "Chrome 앱의 경우 리디렉션 URI를 설정할 필요가 없습니다.",
                    details: "Chrome Identity API를 사용하므로 별도의 리디렉션 URI 설정이 필요하지 않습니다."
                },
                {
                    step: 7,
                    title: "클라이언트 ID 업데이트",
                    description: "생성된 클라이언트 ID를 manifest.json에 업데이트합니다.",
                    details: "현재 클라이언트 ID: " + (clientId || "설정되지 않음")
                },
                {
                    step: 8,
                    title: "확장 프로그램 재로드",
                    description: "Chrome 확장 프로그램을 재로드하고 인증을 다시 시도합니다.",
                    details: "chrome://extensions/ 페이지에서 확장 프로그램의 새로고침 버튼을 클릭하세요."
                }
            ],
            currentClientId: clientId,
            extensionId: extensionId,
            redirectUri: `https://${extensionId}.chromiumapp.org/`,
            troubleshooting: [
                {
                    issue: "OAuth2 request failed: bad client id",
                    solution: "Google Cloud Console에서 Chrome 앱용 OAuth 클라이언트를 생성하고, 애플리케이션 ID에 확장 프로그램 ID를 정확히 입력하세요."
                },
                {
                    issue: "400 오류: client_secret is missing",
                    solution: "Chrome 확장 프로그램에서는 클라이언트 시크릿을 사용할 수 없습니다. OAuth 클라이언트를 'Chrome 앱'으로 설정하고 Chrome Identity API를 사용하세요."
                },
                {
                    issue: "403 오류: API가 활성화되지 않음",
                    solution: "Google Cloud Console에서 Google Calendar API가 활성화되어 있는지 확인하세요."
                },
                {
                    issue: "리디렉션 URI 불일치",
                    solution: "OAuth 클라이언트 설정에서 정확한 리디렉션 URI가 설정되어 있는지 확인하세요."
                },
                {
                    issue: "스코프 부족",
                    solution: "OAuth 클라이언트에서 필요한 스코프가 모두 포함되어 있는지 확인하세요."
                },
                {
                    issue: "토큰 교환 실패",
                    solution: "OAuth 클라이언트가 '웹 애플리케이션'으로 설정되어 있고, 클라이언트 시크릿이 올바르게 설정되어 있는지 확인하세요."
                }
            ]
        };
        
        return guide;
        
    } catch (error) {
        console.error('OAuth 설정 가이드 생성 오류:', error);
        return { 
            success: false, 
            error: '설정 가이드를 생성할 수 없습니다.',
            details: error.message 
        };
    }
}

// OAuth Client Validation function
async function validateOAuthClient() {
    try {
        const manifest = chrome.runtime.getManifest();
        const clientId = manifest.oauth2?.client_id;
        const extensionId = chrome.runtime.id;
        
        if (!clientId) {
            return {
                success: false,
                error: 'OAuth 클라이언트 ID가 manifest.json에 설정되지 않았습니다.',
                solution: 'Google Cloud Console에서 Chrome 앱용 OAuth 클라이언트를 생성하고 manifest.json에 추가하세요.'
            };
        }
        
        // Try to validate the client ID by attempting a simple OAuth request
        try {
            const testToken = await new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ 
                    interactive: false, // Don't show UI for validation
                    scopes: ['https://www.googleapis.com/auth/userinfo.email']
                }, (token) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (token) {
                        resolve(token);
                    } else {
                        reject(new Error('토큰을 받지 못했습니다.'));
                    }
                });
            });
            
            return {
                success: true,
                message: 'OAuth 클라이언트 ID가 유효합니다.',
                clientId: clientId,
                extensionId: extensionId
            };
            
        } catch (validationError) {
            console.error('OAuth 클라이언트 검증 실패:', validationError);
            
            let errorMessage = 'OAuth 클라이언트 ID 검증 실패';
            let solution = '';
            
            if (validationError.message.includes('bad client id')) {
                errorMessage = 'OAuth 클라이언트 ID가 유효하지 않습니다.';
                solution = 'Google Cloud Console에서 Chrome 앱용 OAuth 클라이언트를 생성하고 올바른 클라이언트 ID를 manifest.json에 설정하세요.';
            } else if (validationError.message.includes('invalid_client')) {
                errorMessage = 'OAuth 클라이언트가 존재하지 않거나 비활성화되었습니다.';
                solution = 'Google Cloud Console에서 OAuth 클라이언트가 활성화되어 있는지 확인하세요.';
            } else if (validationError.message.includes('unauthorized_client')) {
                errorMessage = 'OAuth 클라이언트가 Chrome 확장 프로그램을 지원하지 않습니다.';
                solution = 'OAuth 클라이언트를 Chrome 앱용으로 설정했는지 확인하세요.';
            }
            
            return {
                success: false,
                error: errorMessage,
                details: validationError.message,
                solution: solution,
                clientId: clientId,
                extensionId: extensionId,
                setupGuide: {
                    step1: 'Google Cloud Console > APIs & Services > Credentials',
                    step2: 'OAuth 2.0 Client IDs > Create Credentials',
                    step3: 'Application type: Chrome app',
                    step4: 'Application ID: ' + extensionId,
                    step5: 'Copy the Client ID to manifest.json'
                }
            };
        }
        
    } catch (error) {
        console.error('OAuth 클라이언트 검증 오류:', error);
        return { 
            success: false, 
            error: 'OAuth 클라이언트 검증 중 오류가 발생했습니다.',
            details: error.message 
        };
    }
}

// Note: OAuth authentication functions removed - now using Chrome Web Store automatic OAuth handling

// Tab update event (optional)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Necessary actions when page load is complete
        console.log('페이지 로드 완료:', tab.url);
    }
});
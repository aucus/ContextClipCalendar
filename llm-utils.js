// ContextClipCalendar LLM Utilities
// Gemini API integration utilities for content scripts

console.log('ContextClipCalendar LLM utilities loaded');

// Gemini API utility module for content scripts
class GeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    // Basic API call function (content script version)
    async callAPI(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API key is not set.');
        }

        console.log('=== Gemini API call start (content script) ===');
        console.log('API URL:', this.baseUrl);
        console.log('Prompt length:', prompt.length);
        console.log('Prompt preview:', prompt.substring(0, 200) + '...');

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxOutputTokens || 1024,
            }
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('HTTP response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error response body:', errorText);
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('=== Original response text (content script) ===');
            console.log(responseText);
            console.log('=== Original response text end ===');
            console.log('Response text length:', responseText.length);
            
            const data = JSON.parse(responseText);
            console.log('=== Parsed response data (content script) ===');
            console.log(JSON.stringify(data, null, 2));
            console.log('=== Parsed response data end ===');
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                console.log('=== Extracted text (content script) ===');
                console.log(text);
                console.log('=== Extracted text end ===');
                console.log('Text length:', text.length);
                return text;
            } else {
                console.error('Response structure issue:', data);
                throw new Error('API response format is not correct.');
            }
        } catch (error) {
            console.error('=== Gemini API call error (content script) ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    // Extract schedule information (content script version)
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
            console.log('Gemini API calendar info response:', response);
            
            try {
                const parsed = JSON.parse(response);
                console.log('JSON parsing successful:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('JSON parsing failed:', parseError);
                console.log('Failed response:', response);
                
                // JSON extraction attempt
                const extractedJson = this.extractJSONFromResponse(response);
                if (extractedJson) {
                    console.log('JSON extraction successful:', extractedJson);
                    return extractedJson;
                }
                
                // Clean response and retry
                const cleanedResponse = this.cleanResponse(response);
                if (cleanedResponse !== response) {
                    console.log('Retry with cleaned response:', cleanedResponse);
                    try {
                        const parsedCleaned = JSON.parse(cleanedResponse);
                        console.log('Cleaned response parsing successful:', parsedCleaned);
                        return parsedCleaned;
                    } catch (cleanError) {
                        console.log('Cleaned response parsing also failed');
                    }
                }
                
                // Try to extract title from text
                const extractedTitle = this.extractTitleFromText(text);
                console.log('Extracted title from text:', extractedTitle);
                
                // If title extraction fails, throw error
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
            console.error('API call failed:', error);
            throw new Error(`일정 정보 추출 실패: ${error.message}`);
        }
    }

    // Generate summary (content script version)
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

    // Extract JSON from response (content script utility)
    extractJSONFromResponse(response) {
        try {
            console.log('=== JSON extraction attempt (content script) ===');
            console.log('Original response length:', response.length);
            console.log('Original response:', response);
            
            // Clean response
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
                if (blockContent.startsWith('{') && blockContent.endsWith('}')) {
                    return JSON.parse(blockContent);
                }
            }
            
            // Find JSON surrounded by braces
            const jsonMatches = cleanedResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
            if (jsonMatches && jsonMatches.length > 0) {
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
            
            // Find JSON array
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
            return null;
        }
    }

    // Clean response (content script utility)
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
            console.error('Response cleaning failed:', error);
            return response;
        }
    }

    // Extract title from text (content script utility)
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
                    /([가-힣a-zA-Z]+\s*이벤트)/i
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
            console.error('Title extraction failed:', error);
            return null;
        }
    }

    // Check if text is time expression
    isTimeExpression(text) {
        const timePatterns = [
            /^\d{1,2}시/, /^\d{1,2}분/, /^오전/, /^오후/, /^내일/, /^오늘/, /^다음주/,
            /^\d{4}년/, /^\d{1,2}월/, /^\d{1,2}일/,
            /^월요일/, /^화요일/, /^수요일/, /^목요일/, /^금요일/, /^토요일/, /^일요일/
        ];
        
        return timePatterns.some(pattern => pattern.test(text));
    }

    // Check if word is common
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

    // Extract keywords
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
            console.error('Keyword extraction failed:', error);
            return [];
        }
    }
}

// Export for use in content scripts (if needed)
if (typeof window !== 'undefined') {
    window.ContextClipGeminiAPI = GeminiAPI;
}

console.log('ContextClipCalendar LLM utilities initialized successfully');
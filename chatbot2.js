// saas-chatbot-widget.js
(function () {
    // Configuration
    const defaultConfig = {
        primaryColor: '#4f46e5',
        position: 'bottom-right',
        apiBaseUrl: 'http://localhost:5008/question/ask', // Your backend endpoint
        apiBaseUrlInit: 'http://localhost:5008/initiate-website', // Your backend endpoint
        botTitle: 'Support Assistant',
        welcomeMessage: 'Hello! How can I help you today?',
        uploadEnabled: true,
        allowedFileTypes: ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
        maxFileSize: 5 // MB
    };

    // DOM Elements
    let chatContainer, chatButton, chatHeader, chatBody, inputArea;
    let messageHistory = [];
    let isTyping = false;

    // Create main chatbot container
    function createChatContainer() {
        chatContainer = document.createElement('div');
        chatContainer.id = 'saas-chatbot-container';
        chatContainer.style.cssText = `
            position: fixed;
            z-index: 10000;
            ${defaultConfig.position.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
            ${defaultConfig.position.includes('right') ? 'right: 20px' : 'left: 20px'};
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: none;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(chatContainer);
    }

    // Create header with history controls
    function createHeader() {
        chatHeader = document.createElement('div');
        chatHeader.style.cssText = `
            background: ${defaultConfig.primaryColor};
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '10px';

        const title = document.createElement('h3');
        title.style.margin = '0';
        title.textContent = defaultConfig.botTitle;

        const historyIndicator = document.createElement('span');
        historyIndicator.id = 'saas-chatbot-history-indicator';
        historyIndicator.style.cssText = `
            font-size: 12px;
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 10px;
            cursor: pointer;
        `;
        historyIndicator.textContent = 'New Chat';
        historyIndicator.addEventListener('click', toggleHistoryMenu);

        titleContainer.appendChild(title);
        titleContainer.appendChild(historyIndicator);

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            background: transparent;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        `;
        closeBtn.addEventListener('click', toggleChat);

        chatHeader.appendChild(titleContainer);
        chatHeader.appendChild(closeBtn);
        chatContainer.appendChild(chatHeader);
    }

    // Create history menu
    function createHistoryMenu() {
        const menu = document.createElement('div');
        menu.id = 'saas-chatbot-history-menu';
        menu.style.cssText = `
            position: absolute;
            top: 60px;
            left: 16px;
            right: 16px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            z-index: 100;
            padding: 10px;
            display: none;
            flex-direction: column;
            max-height: 300px;
            overflow-y: auto;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
        `;

        const menuTitle = document.createElement('h4');
        menuTitle.style.margin = '0';
        menuTitle.textContent = 'Conversations';

        const newChatBtn = document.createElement('button');
        newChatBtn.textContent = '+ New';
        newChatBtn.style.cssText = `
            background: ${defaultConfig.primaryColor};
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
        `;
        newChatBtn.addEventListener('click', startNewChat);

        header.appendChild(menuTitle);
        header.appendChild(newChatBtn);
        menu.appendChild(header);

        const historyList = document.createElement('div');
        historyList.id = 'saas-chatbot-history-list';
        menu.appendChild(historyList);

        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            text-align: right;
        `;

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All';
        clearBtn.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
        `;
        clearBtn.addEventListener('click', clearHistory);
        footer.appendChild(clearBtn);
        menu.appendChild(footer);

        chatContainer.appendChild(menu);
        loadHistoryList();
    }

    // Create chat body
    function createChatBody() {
        chatBody = document.createElement('div');
        chatBody.id = 'saas-chatbot-body';
        chatBody.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f9fafb;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        chatContainer.appendChild(chatBody);

        // Load saved history if exists
        const savedHistory = localStorage.getItem('saas-chatbot-history');
        if (savedHistory) {
            messageHistory = JSON.parse(savedHistory);
            messageHistory.forEach(msg => {
                if (msg.type === 'message') {
                    addMessage(msg.content, msg.sender, false);
                }
            });
        } else {
            // Add welcome message if new chat
            addBotMessage(defaultConfig.welcomeMessage);
        }
    }

    // Create input area with file upload
    function createInputArea() {
        inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;

        const fileContainer = document.createElement('div');
        fileContainer.style.cssText = `
            display: flex;
            gap: 4px;
            align-items: center;
        `;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'saas-chatbot-file-input';
        fileInput.style.display = 'none';
        fileInput.accept = defaultConfig.allowedFileTypes.map(t => `.${t}`).join(',');
        fileInput.addEventListener('change', handleFileUpload);

        const fileButton = document.createElement('button');
        fileButton.innerHTML = '📎';
        fileButton.style.cssText = `
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
        `;
        fileButton.addEventListener('click', () => fileInput.click());

        fileContainer.appendChild(fileButton);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'saas-chatbot-input';
        input.placeholder = 'Ask a question...';
        input.style.cssText = `
            flex: 1;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: border 0.3s;
        `;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isTyping) sendMessage();
        });

        const sendBtn = document.createElement('button');
        sendBtn.innerHTML = '&#10148;';
        sendBtn.style.cssText = `
            background: ${defaultConfig.primaryColor};
            color: white;
            border: none;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        sendBtn.addEventListener('click', () => {
            if (!isTyping) sendMessage();
        });

        inputContainer.appendChild(fileContainer);
        inputContainer.appendChild(input);
        inputContainer.appendChild(sendBtn);
        inputArea.appendChild(inputContainer);

        // File upload status
        const fileStatus = document.createElement('div');
        fileStatus.id = 'saas-chatbot-file-status';
        fileStatus.style.cssText = `
            font-size: 12px;
            color: #6b7280;
            display: none;
        `;
        inputArea.appendChild(fileStatus);

        chatContainer.appendChild(inputArea);
    }

    // Create floating button
    function createChatButton() {
        chatButton = document.createElement('button');
        chatButton.id = 'saas-chatbot-button';
        chatButton.style.cssText = `
            position: fixed;
            z-index: 9999;
            ${defaultConfig.position.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
            ${defaultConfig.position.includes('right') ? 'right: 20px' : 'left: 20px'};
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: ${defaultConfig.primaryColor};
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.3s ease;
        `;
        chatButton.innerHTML = '&#128172;';
        chatButton.addEventListener('click', toggleChat);
        document.body.appendChild(chatButton);
    }

    // Toggle chat visibility
    function toggleChat() {
        if (chatContainer.style.display === 'flex') {
            chatContainer.style.display = 'none';
            chatButton.style.display = 'flex';
            document.getElementById('saas-chatbot-history-menu').style.display = 'none';
        } else {
            chatContainer.style.display = 'flex';
            chatButton.style.display = 'none';
        }
    }

    // Toggle history menu
    function toggleHistoryMenu() {
        const menu = document.getElementById('saas-chatbot-history-menu');
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }

    // Add message to chat
    function addMessage(content, sender, saveToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            max-width: 80%;
            padding: 12px;
            border-radius: 8px;
            line-height: 1.4;
            word-wrap: break-word;
            align-self: ${sender === 'user' ? 'flex-end' : 'flex-start'};
            background: ${sender === 'user' ? '#e0e7ff' : '#ffffff'};
            border: ${sender === 'bot' ? '1px solid #e5e7eb' : 'none'};
            animation: fadeIn 0.3s ease;
        `;

        if (typeof content === 'string') {
            messageDiv.textContent = content;
        } else if (content.type === 'file') {
            const fileInfo = document.createElement('div');
            fileInfo.textContent = `📄 ${content.name}`;
            fileInfo.style.marginBottom = '8px';
            fileInfo.style.fontWeight = 'bold';

            const downloadLink = document.createElement('a');
            downloadLink.href = content.url;
            downloadLink.download = content.name;
            downloadLink.textContent = 'Download';
            downloadLink.style.cssText = `
                display: inline-block;
                background: ${defaultConfig.primaryColor};
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                text-decoration: none;
                margin-top: 8px;
            `;

            messageDiv.appendChild(fileInfo);
            messageDiv.appendChild(downloadLink);
        }

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Save to history
        if (saveToHistory) {
            messageHistory.push({
                type: 'message',
                content: content,
                sender: sender,
                timestamp: new Date().toISOString()
            });
            saveHistory();
        }

        return messageDiv;
    }

    // Add typing indicator
    function showTypingIndicator() {
        if (isTyping) return;

        isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'saas-chatbot-typing';
        typingDiv.style.cssText = `
            align-self: flex-start;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 8px;
        `;

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #9ca3af;
                animation: typing-dot 1.5s infinite ease-in-out;
                animation-delay: ${0.3 * i}s;
            `;
            typingDiv.appendChild(dot);
        }

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes typing-dot {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-5px); }
            }
        `;
        typingDiv.appendChild(style);

        chatBody.appendChild(typingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        return typingDiv;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typing = document.getElementById('saas-chatbot-typing');
        if (typing) {
            typing.remove();
            isTyping = false;
        }
    }

    function addBotMessage(content) {
        addMessage(content, 'bot');
    }

    function addUserMessage(content) {
        addMessage(content, 'user');
    }

    // Handle file upload
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileStatus = document.getElementById('saas-chatbot-file-status');
        fileStatus.style.display = 'block';

        // Validate file
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!defaultConfig.allowedFileTypes.includes(fileExt)) {
            fileStatus.innerHTML = `<span style="color:#ef4444">Invalid file type. Allowed: ${defaultConfig.allowedFileTypes.join(', ')}</span>`;
            e.target.value = '';
            return;
        }

        if (file.size > defaultConfig.maxFileSize * 1024 * 1024) {
            fileStatus.innerHTML = `<span style="color:#ef4444">File too large (max ${defaultConfig.maxFileSize}MB)</span>`;
            e.target.value = '';
            return;
        }

        fileStatus.textContent = `Uploading ${file.name}...`;

        // In a real implementation, you would upload to your server
        // This is a simulation
        setTimeout(() => {
            const fileUrl = URL.createObjectURL(file);
            addMessage({
                type: 'file',
                name: file.name,
                url: fileUrl,
                size: file.size
            }, 'user');

            fileStatus.textContent = `Uploaded: ${file.name}`;
            e.target.value = '';

            // Auto-clear status after 3 seconds
            setTimeout(() => {
                fileStatus.style.display = 'none';
            }, 3000);
        }, 1500);
    }

    // Send message to backend
    async function sendMessage() {
        const input = document.getElementById('saas-chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        input.value = '';
        addUserMessage(message);

        const typing = showTypingIndicator();

        try {
            const response = await fetch(defaultConfig.apiBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                    // website_url: window.location.href,
                    // history: messageHistory.filter(msg => msg.type === 'message')
                })
            });

            const data = await response.json();
            hideTypingIndicator();
            addBotMessage(data.answer || "I couldn't find an answer to that question.");
        } catch (error) {
            hideTypingIndicator();
            addBotMessage("Sorry, I'm having trouble connecting. Please try again later.");
            console.error('Chatbot error:', error);
        }
    }

    // Save history to localStorage
    function saveHistory() {
        localStorage.setItem('saas-chatbot-history', JSON.stringify(messageHistory));
        updateHistoryIndicator();
    }

    // Update history indicator
    function updateHistoryIndicator() {
        const indicator = document.getElementById('saas-chatbot-history-indicator');
        const msgCount = messageHistory.filter(msg => msg.type === 'message').length;

        if (msgCount > 1) {
            indicator.textContent = `${msgCount} messages`;
            indicator.style.display = 'block';
        } else {
            indicator.textContent = 'New Chat';
        }
    }

    // Load history list
    function loadHistoryList() {
        const historyList = document.getElementById('saas-chatbot-history-list');
        historyList.innerHTML = '';

        // Get all saved conversations
        const allHistory = { ...localStorage };
        const historyItems = [];

        for (const key in allHistory) {
            if (key.startsWith('saas-chatbot-history-')) {
                try {
                    const history = JSON.parse(allHistory[key]);
                    if (history.length > 0) {
                        historyItems.push({
                            key,
                            timestamp: history[0].timestamp,
                            preview: history[0].content
                        });
                    }
                } catch (e) {
                    console.error('Error parsing history', e);
                }
            }
        }

        // Sort by timestamp
        historyItems.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp));

        // Render history items
        historyItems.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.style.cssText = `
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 8px;
                cursor: pointer;
                background: #f9fafb;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            historyItem.addEventListener('mouseover', () => {
                historyItem.style.background = '#edf2f7';
            });
            historyItem.addEventListener('mouseout', () => {
                historyItem.style.background = '#f9fafb';
            });

            const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            historyItem.textContent = `${time}: ${item.preview.substring(0, 50)}${item.preview.length > 50 ? '...' : ''}`;
            historyItem.addEventListener('click', () => loadHistory(item.key));

            historyList.appendChild(historyItem);
        });

        if (historyItems.length === 0) {
            historyList.innerHTML = '<div style="padding:10px;text-align:center;color:#6b7280">No saved conversations</div>';
        }
    }

    // Load specific history
    function loadHistory(key) {
        const history = JSON.parse(localStorage.getItem(key));
        if (!history) return;

        // Clear current chat
        chatBody.innerHTML = '';
        messageHistory = history;

        // Render messages
        messageHistory.forEach(msg => {
            if (msg.type === 'message') {
                addMessage(msg.content, msg.sender, false);
            }
        });

        toggleHistoryMenu();
        updateHistoryIndicator();
    }

    // Start new chat
    function startNewChat() {
        // Save current chat if not empty
        if (messageHistory.length > 0) {
            const timestamp = new Date().toISOString();
            localStorage.setItem(`saas-chatbot-history-${timestamp}`, JSON.stringify(messageHistory));
        }

        // Clear current chat
        chatBody.innerHTML = '';
        messageHistory = [];
        saveHistory();

        // Add welcome message
        addBotMessage(defaultConfig.welcomeMessage);
        toggleHistoryMenu();
        loadHistoryList();
    }

    // Clear all history
    function clearHistory() {
        // Clear all history keys
        for (const key in localStorage) {
            if (key.startsWith('saas-chatbot-history')) {
                localStorage.removeItem(key);
            }
        }

        // Clear current chat
        chatBody.innerHTML = '';
        messageHistory = [];
        saveHistory();

        // Add welcome message
        addBotMessage(defaultConfig.welcomeMessage);
        loadHistoryList();
    }

    // Intiating bot by ingesting content
    async function initiateBot(baseUrl) {
        try {
            await fetch(defaultConfig.apiBaseUrlInit, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    website: baseUrl,
                })
            });
            getFaviconUrl(baseUrl)
        } catch (e) {
            console.error('Chatbot error:', error);
            addBotMessage("Sorry, I'm having trouble connecting. Please try again later.");
        }
    }
    function getFaviconUrl(domain) {
        return `https://www.google.com/s2/favicons?domain=${domain}`;
    }

    // Initialize the widget
    function init() {
        createChatContainer();
        createHeader();
        createHistoryMenu();
        createChatBody();
        createInputArea();
        createChatButton();
        updateHistoryIndicator();

        // Auto-open for first-time users
        const firstVisit = !localStorage.getItem('saas-chatbot-visited');
        if (firstVisit) {
            const baseUrl = window.location.origin;
            initiateBot(baseUrl);
            setTimeout(() => {
                toggleChat();
                localStorage.setItem('saas-chatbot-visited', 'true');
            }, 3000);
        }
    }

    // Load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
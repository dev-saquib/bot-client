// saas-chatbot-widget.js
(function () {
    // Configuration - Customer can override these
    const config = {
        primaryColor: '#4f46e5',
        position: 'bottom-right',
        apiBaseUrl: 'http://localhost:5008/question/ask', // Your backend endpoint
        apiBaseUrlInit: 'http://localhost:5008/initiate-website', // Your backend endpoint
        botTitle: 'Support Assistant',
        welcomeMessage: 'Hello! How can I help you today?'
    };

    // DOM Elements
    let chatContainer, chatButton, chatHeader, chatBody, inputArea;

    // Create main chatbot container
    function createChatContainer() {
        chatContainer = document.createElement('div');
        chatContainer.id = 'saas-chatbot-container';
        chatContainer.style.cssText = `
            position: fixed;
            z-index: 10000;
            ${config.position.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
            ${config.position.includes('right') ? 'right: 20px' : 'left: 20px'};
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

    // Create header
    function createHeader() {
        chatHeader = document.createElement('div');
        chatHeader.style.cssText = `
            background: ${config.primaryColor};
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h3');
        title.style.margin = '0';
        title.textContent = config.botTitle;

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

        chatHeader.appendChild(title);
        chatHeader.appendChild(closeBtn);
        chatContainer.appendChild(chatHeader);
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

        // Add welcome message
        addBotMessage(config.welcomeMessage);
        chatContainer.appendChild(chatBody);
    }

    // Create input area
    function createInputArea() {
        inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: flex;
            gap: 8px;
        `;

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
            if (e.key === 'Enter') sendMessage();
        });

        const sendBtn = document.createElement('button');
        sendBtn.innerHTML = '&#10148;';
        sendBtn.style.cssText = `
            background: ${config.primaryColor};
            color: white;
            border: none;
            border-radius: 8px;
            width: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        sendBtn.addEventListener('click', sendMessage);

        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);
        chatContainer.appendChild(inputArea);
    }

    // Create floating button
    function createChatButton() {
        chatButton = document.createElement('button');
        chatButton.id = 'saas-chatbot-button';
        chatButton.style.cssText = `
            position: fixed;
            z-index: 9999;
            ${config.position.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
            ${config.position.includes('right') ? 'right: 20px' : 'left: 20px'};
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: ${config.primaryColor};
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
        } else {
            chatContainer.style.display = 'flex';
            chatButton.style.display = 'none';
        }
    }

    // Add message to chat
    function addMessage(content, sender) {
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
        `;

        messageDiv.textContent = content;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function addBotMessage(content) {
        addMessage(content, 'bot');
    }

    function addUserMessage(content) {
        addMessage(content, 'user');
    }

    // Send message to backend
    async function sendMessage() {
        const input = document.getElementById('saas-chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        input.value = '';
        addUserMessage(message);

        try {
            const response = await fetch(config.apiBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                })
            });

            const data = await response.json();
            addBotMessage(data.answer || "I couldn't find an answer to that question.");
        } catch (error) {
            console.error('Chatbot error:', error);
            addBotMessage("Sorry, I'm having trouble connecting. Please try again later.");
        }
    }

    // Intiating bot by ingesting content
    async function initiateBot(baseUrl) {
        try {
            await fetch(config.apiBaseUrlInit, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    website: baseUrl,
                })
            });
        } catch (e) {
            console.error('Chatbot error:', error);
            addBotMessage("Sorry, I'm having trouble connecting. Please try again later.");
        }
    }

    // Initialize the widget
    function init() {
        createChatContainer();
        createHeader();
        createChatBody();
        createInputArea();
        createChatButton();

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
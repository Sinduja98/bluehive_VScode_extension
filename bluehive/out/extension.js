"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
function activate(context) {
    console.log('BlueHive Chatbot extension is now active!');
    // Register the command to open the chatbot panel
    const disposableChatbot = vscode.commands.registerCommand('bluehive.helloWorld', async () => {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel('bluehiveChatbot', 'BlueHive Chatbot', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        const apiKey = 'BHSK-sandbox-GxuFjWNW1lSvP-t9XStZyLWxMBZGQF9dhCHzrIXk';
        if (!apiKey) {
            vscode.window.showErrorMessage('BlueHive API key not found.');
            return;
        }
        // HTML content for the chatbot interface
        panel.webview.html = getWebviewContent();
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    try {
                        console.log('Sending message:', message.text);
                        const response = await sendMessageToBluehive(message.text, apiKey);
                        console.log('Received response:', response);
                        panel.webview.postMessage({
                            command: 'receivedMessage',
                            text: response
                        });
                    }
                    catch (error) {
                        console.error('Full error details:', error);
                        vscode.window.showErrorMessage(`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        panel.webview.postMessage({
                            command: 'receivedMessage',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                    return;
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposableChatbot);
}
// Function to send message to BlueHive API
// async function sendMessageToBluehive(message: string, apiKey: string): Promise<string> {
//     try {
//         console.log('Attempting to send message to BlueHive API');
//         const response = await axios.post('https://api.bluehive.ai/v1/chat', 
//             { 
//                 message: message 
//             }, 
//             {
//                 headers: {
//                     'Authorization': `Bearer ${apiKey}`,
//                     'Content-Type': 'application/json'
//                 },
//                 timeout: 10000 // 10 second timeout
//             }
//         );
//         console.log('API Response:', response.data);
//         return response.data.response || response.data.message || 'No response from API';
//     } catch (error) {
//         console.error('API Call Error:', error);
//         throw error;
//     }
// }
async function sendMessageToBluehive(message, apiKey) {
    try {
        console.log('Attempting to send message to BlueHive API');
        const response = await axios_1.default.post('https://ai.bluehive.com/api/v1/completion', {
            prompt: message,
            systemMessage: "You are a helpful chatbot named Will."
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });
        console.log('API Response:', response.data);
        // Extract the AI's response from the choices array
        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content || 'No response from API';
        }
        return 'No response from API';
    }
    catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}
// Generate HTML content for the webview
function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BlueHive Chatbot</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                height: 100vh; 
                margin: 0; 
                padding: 10px; 
            }
            #chat-messages {
                flex-grow: 1;
                overflow-y: auto;
                border: 1px solid #ccc;
                padding: 10px;
                margin-bottom: 10px;
            }
            #message-input {
                display: flex;
            }
            #message-input input {
                flex-grow: 1;
                margin-right: 10px;
            }
        </style>
    </head>
    <body>
        <div id="chat-messages"></div>
        <div id="message-input">
            <input type="text" id="chat-input" placeholder="Type your message...">
            <button id="send-btn">Send</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const chatMessages = document.getElementById('chat-messages');
            const chatInput = document.getElementById('chat-input');
            const sendBtn = document.getElementById('send-btn');

            function addMessage(message, sender) {
                const messageEl = document.createElement('div');
                messageEl.textContent = sender + ': ' + message;
                messageEl.style.marginBottom = '10px';
                messageEl.style.color = sender === 'You' ? 'blue' : 'green';
                chatMessages.appendChild(messageEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            sendBtn.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (message) {
                    addMessage(message, 'You');
                    vscode.postMessage({
                        command: 'sendMessage',
                        text: message
                    });
                    chatInput.value = '';
                }
            });

            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendBtn.click();
                }
            });

            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message.command === 'receivedMessage') {
                    addMessage(message.text, 'BlueHive');
                }
            });
        </script>
    </body>
    </html>
    `;
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map
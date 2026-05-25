// --- INTELLICHAT LOGIC ---

// This function runs when the user clicks the "Send" button
async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const userText = inputField.value.trim();

    // Don't do anything if the text box is empty
    if (userText === "") return;

    // 1. Show the user's message in the chat
    addMessageToChat(userText, "user-message");
    
    // Clear the input field
    inputField.value = "";

    // 2. Show a temporary "Thinking" message (CSS handles the animated dots)
    addMessageToChat("Thinking", "bot-message", "temp-msg");

    // 3. Wait for the bot to get the response from the API
    const botResponse = await getBotResponse(userText);

    // 4. Remove the "Thinking" message
    const tempMsg = document.querySelector(".temp-msg");
    if (tempMsg) tempMsg.remove();

    // 5. Show the real response
    addMessageToChat(botResponse, "bot-message");
}

// This function allows the user to press "Enter" to send a message
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// This function formats text to render images and bold text!
function formatText(text) {
    // 1. Convert Markdown images with a safety fallback and NO-REFERRER policy
    let formatted = text.replace(/!\[([^\]]*)\]\((.*?)\)/g, (match, alt, url) => {
        let cleanUrl = url.trim();
        
        // Add a random seed to prevent caching
        if (cleanUrl.includes('pollinations.ai') && !cleanUrl.includes('seed=')) {
            const separator = cleanUrl.includes('?') ? '&' : '?';
            cleanUrl += `${separator}seed=${Math.floor(Math.random() * 1000)}`;
        }
        
        const fallbackImg = "https://placehold.co/400x300/e2e3e5/333333?text=Image+Blocked+by+Browser";
        
        // 👉 NEW: Added referrerpolicy="no-referrer" to the img tag
        return `<img src="${encodeURI(cleanUrl)}" alt="${alt}" class="chat-image" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackImg}';">`;
    });
    
    // 2. Convert standard direct image URLs to images
    formatted = formatted.replace(/(^|\s)(https?:\/\/\S+\.(?:png|jpe?g|gif|webp))(\s|$)/gi, (match, space1, url, space2) => {
        const fallbackImg = "https://placehold.co/400x300/e2e3e5/333333?text=Image+Blocked+by+Browser";
        
        // 👉 NEW: Added referrerpolicy="no-referrer" here too
        return `${space1}<img src="${encodeURI(url.trim())}" class="chat-image" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackImg}';">${space2}`;
    });

    // 3. Convert basic bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 4. Convert line breaks so paragraphs look nice
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// This function physically adds the text bubbles to the screen
function addMessageToChat(text, className, extraClass = "") {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    
    messageDiv.classList.add("message");
    messageDiv.classList.add(className);
    
    // Add extra class if provided (used for the temporary thinking message)
    if (extraClass) {
        messageDiv.classList.add(extraClass);
    }
    
    // Use innerHTML so images and formatting render!
    messageDiv.innerHTML = formatText(text);
    
    chatBox.appendChild(messageDiv);
    
    // Wait a tiny bit for the image to load before scrolling to the bottom
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}

// --- INTELLICHAT'S BRAIN (API CONNECTION) ---
async function getBotResponse(userInput) {
    let text = userInput.toLowerCase();

    // 1. KEEP YOUR CUSTOM PROJECT RESPONSES
    if (text.includes("project")) {
        return "This is a college project designed by Divyam Gupta, Gourvi Pardhi, Himanshu Prajapati and Dhrati Rai to show a Distributed Chat-Bot System!";
    }
    if (text.includes("who made you") || text.includes("creator")) {
        return "I was created by brilliant college students Divyam Gupta, Gourvi Pardhi, Himanshu Prajapati and Dhrati Rai for their project.";
    }

    // 2. CONNECT TO GEMINI API
    const API_KEY = "AIzaSyAqZ_qWWxxeIrTMCFp2KfCfJTwqc0XbiP0"; // <-- YOUR API KEY
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // THE SECRET SAUCE: Tell Gemini exactly how to format image requests
    const systemRules = "You are IntelliChat, a helpful assistant. If the user asks for a picture, photo, drawing, or image of anything, you MUST include a markdown image link in your response. Format it exactly like this: ![description](https://image.pollinations.ai/prompt/detailed-description-of-the-image). Replace 'detailed-description-of-the-image' with a highly descriptive prompt using hyphens instead of spaces. Example: ![a futuristic city](https://image.pollinations.ai/prompt/a-futuristic-city-at-night-with-neon-lights). Always include a polite text response along with the image.";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemRules }]
                },
                contents: [{
                    parts: [{ text: userInput }]
                }]
            })
        });

        const data = await response.json();

        // 3. CHECK IF GOOGLE RETURNED AN ERROR
        if (!response.ok) {
            console.error("API Error Details:", data);
            return `Oops! Server error: ${data.error.message || "Please check the console."}`;
        }
        
        // Extract the text from the successful JSON response
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Network or Parsing Error:", error);
        return "I'm having trouble connecting to my brain! Please open the browser console (F12) to see the exact error.";
    }
}

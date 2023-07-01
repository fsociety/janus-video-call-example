import SharedUtil from "../utils/shared-util.js";
import { createChatMessageEl, playNotificationSound } from "../utils/helpers.js";

let isTypingTimer;
let isTyping = false;
const chatBtn = document.querySelector("#chat-btn");
const chatContainer = document.querySelector(".chat-container");
const closeChatBtn = document.querySelector("#close-chat");
const resizeChatBtn = document.querySelector("#resize-chat");
const chatInput = document.querySelector(".chat-input input");
const chatInner = chatContainer.querySelector(".chat-inner");
chatContainer.style.left = chatBtn.getBoundingClientRect().x + "px";

chatBtn.addEventListener("click",() => {
    chatBtn.querySelector(".badge.red").classList.remove("active");
    chatContainer.classList.toggle("active");
});

closeChatBtn.addEventListener("click",() => {
    chatContainer.classList.remove("active");
})

resizeChatBtn.addEventListener("click", () => {
    chatContainer.classList.toggle("maximize");
})

chatInput.addEventListener("keyup",(e) => {
    if(e.key === "Backspace") return;
    clearTimeout(isTypingTimer);
    isTypingTimer = setTimeout(() => {
        if(isTyping){
            isTyping = false;
            typingNotification();
        }
    }, 750);
    if(e.key === "Enter"){
        let msg = e.target.value;
        chatInner.appendChild(createChatMessageEl({
            message: msg
        }, true));
        SharedUtil.socketOperations.sendChatMessage({
            message: msg
        })
        chatInner.scrollTop = chatInner.scrollHeight;
        chatInput.value = "";
    }
})

chatInput.addEventListener("keydown",(e) => {
    const key = e.key.toLowerCase();
    if (key.length !== 1) return;
    const isLetter = (key >= 'a' && key <= 'z');
    const isNumber = (key >= '0' && key <= '9');
    if(!isLetter && !isNumber) return;
    if(e.key === "Backspace" && !isTyping){
        typingNotification();
        return;
    }
    if(!isTyping){
        isTyping = true;
        typingNotification();
    }
})

function typingNotification(){
    SharedUtil.socketOperations.sendChatTypingNotification({
        isTyping
    });
}

export function chatMessages(options){
    const chatInner = document.querySelector(".chat-container .chat-inner");
    chatInner.appendChild(createChatMessageEl({
        username: options.username,
        message: options.message
    }));
    chatInner.scrollTop = chatInner.scrollHeight;
    playNotificationSound();
}

export function setChatStateNotification(options){
    const csn = document.getElementById("chat-state-notification");
    if(options.isTyping === true){
        csn.textContent = options.username + " typing...";
    } else {
        csn.textContent = "";
    }
}

export function userConnectNotification(options){
    const notification = document.createElement("div");
    notification.className = "notification";
    if(options.online === false){
        notification.textContent = `${options.username} left.`;
    }else{
        notification.textContent = `${options.username} joined.`;
    }
    chatInner.appendChild(notification);
    chatInner.scrollTop = chatInner.scrollHeight;
}
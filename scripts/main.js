const sanitaize = {
    encode: function (str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, "<br>");
    },

    decode: function (str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/<br>/g, "\n");
    }
};

const sounds = [
    () => document.querySelector("#sound").checked && new Audio("./sounds/0.mp3").play(),
    () => document.querySelector("#sound").checked && new Audio("./sounds/1.mp3").play(),
    () => document.querySelector("#sound").checked && new Audio("./sounds/2.mp3").play(),
];
const alarms = [
    () => document.querySelector("#sound").checked && new Audio("./alarms/beep.mp3").play(),
    () => document.querySelector("#sound").checked && new Audio("./alarms/iron.mp3").play()
];

function saveChatLog() {
    const chatLog = [];
    document.querySelectorAll(".message").forEach((message) => {
        chatLog.push({
            text: sanitaize.decode(message.innerHTML),
            isUser: message.classList.contains("user"),
            isKana: message.classList.contains("kana")
        });
    });
    localStorage.setItem("chat_log", JSON.stringify(chatLog));
}

var audio = new Audio();
function speech(text) {
    audio.pause();
    document.querySelector("#voice").checked && fetch("https://kana.renorari.net/api/v2/voice", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "text": text,
            "voice_id": document.querySelector("#voice_list").value,
            "speed": 1.2,
            "tone": 0,
            "intonation": 1,
            "between": 0.25,
            "volume": 0,
            "user": {
                "id": JSON.parse(localStorage.getItem("userinfo")).id,
                "password": JSON.parse(localStorage.getItem("userinfo")).password
            }
        })
    }).then((response) => {
        response.blob().then((blob) => {
            audio = new Audio(URL.createObjectURL(blob));
            audio.play();
        });
    }).catch((error) => {
        console.error(error);
    });
}

function sendMessage() {
    fetch("https://kana.renorari.net/api/v2/chat", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "message": document.querySelector(".message.user:last-child").innerHTML,
            "user": {
                "id": JSON.parse(localStorage.getItem("userinfo")).id,
                "password": JSON.parse(localStorage.getItem("userinfo")).password
            },
            "character_name": "default",
            "custom_character": ""
        })
    }).then((response) => {
        if (response.status == 200) {
            response.json().then((message) => {
                const messageElement = document.createElement("div");
                messageElement.classList.add("message");
                messageElement.classList.add("kana");
                messageElement.innerHTML = sanitaize.encode(message.reply);
                document.querySelector("#chat").appendChild(messageElement);
                document.querySelector("#chat").scrollTop = document.querySelector("#chat").scrollHeight;
                saveChatLog();
                speech(message.reply);
            }).catch((error) => {
                console.error(error);
            });
        } else {
            response.text().then((text) => {
                console.error(text);
            }).catch((error) => {
                console.error(error);
            });
        }
    }).catch((error) => {
        console.error(error);
    });
}

function updateVoiceList() {
    fetch("https://kana.renorari.net/api/v2/voice").then((response) => {
        if (response.status == 200) {
            response.json().then((voices) => {
                Object.keys(voices).forEach((key) => {
                    const optionElement = document.createElement("option");
                    optionElement.value = key;
                    optionElement.innerHTML = voices[key].name;
                    document.querySelector("#voice_list").appendChild(optionElement);
                });
            }).catch((error) => {
                console.error(error);
            });
        } else {
            response.text().then((text) => {
                console.error(text);
            }).catch((error) => {
                console.error(error);
            });
        }
    });
}

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "ja-JP";
recognition.interimResults = true;
document.addEventListener("DOMContentLoaded", () => {
    //moment().locale("ja").fromNow();
    localStorage.getItem("userinfo") && login(JSON.parse(localStorage.getItem("userinfo")).id, JSON.parse(localStorage.getItem("userinfo")).password, true);
    localStorage.getItem("sound") && (document.querySelector("#sound").checked = (localStorage.getItem("sound") == "true"));
    localStorage.getItem("voice") && (document.querySelector("#voice").checked = (localStorage.getItem("voice") == "true"));
    localStorage.getItem("voice_list") && (document.querySelector("#voice_list").value = (localStorage.getItem("voice_list")));
    if (localStorage.getItem("chat_log")) {
        JSON.parse(localStorage.getItem("chat_log")).forEach((message) => {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            message.isUser && messageElement.classList.add("user");
            message.isKana && messageElement.classList.add("kana");
            messageElement.innerHTML = sanitaize.encode(message.text);
            document.querySelector("#chat").appendChild(messageElement);
            document.querySelector("#chat").scrollTop = document.querySelector("#chat").scrollHeight;
        });
    } else {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.innerHTML = "ようこそ。<br>Kanaはこのようなことができます…";
        document.querySelector("#chat").appendChild(messageElement);
        document.querySelector("#chat").scrollTop = document.querySelector("#chat").scrollHeight;
        saveChatLog();
    }

    function resetLogin() {
        document.querySelector("#login h3").innerHTML = "ログイン";
        document.querySelector("#login_button").innerHTML = "ログイン";
        document.querySelector("#login_button").attributes.removeNamedItem("disabled");
    }
    function login(id, password, auto = false) {
        document.querySelector("#login_message").innerHTML = "ログイン中...";
        document.querySelector("#login_button").innerHTML = "<span class=\"material-symbols-rounded rotate\">cached</span>";
        document.querySelector("#login_button").attributes.setNamedItem(document.createAttribute("disabled"));
        fetch("https://kana.renorari.net/api/v2/account/info", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "user": {
                    "id": id,
                    "password": password
                }
            })
        }).then((response) => {
            if (response.status == 200) {
                response.json().then((user) => {
                    document.querySelector("#login h3").innerHTML = "ようこそ";
                    document.querySelector("#login #login_message").innerHTML = `${user.name}さん`;
                    document.querySelector("#login_button").innerHTML = "<span class=\"material-symbols-rounded\">done</span>";
                    localStorage.setItem("userinfo", JSON.stringify(user));
                    document.querySelector("#user_name").innerHTML = user.name;
                    document.querySelector("#user_id").innerHTML = user.id;
                    if (auto) {
                        document.querySelector("#login").style.display = "none";
                    } else {
                        setTimeout(() => {
                            document.querySelector("#login").classList.add("fadeout");
                            setTimeout(() => {
                                document.querySelector("#login").style.display = "none";
                                document.querySelector("#settings").classList.remove("fadeout");
                            }, 499);
                        }, 500);
                    }
                }).catch((error) => {
                    document.querySelector("#login_message").innerHTML = "エラーが発生しました<br>もう一度お試しください";
                    console.error(error);
                    resetLogin();
                });
            } else if (response.status == 401) {
                document.querySelector("#login_message").innerHTML = "ユーザーIDまたはパスワードが違います";
                resetLogin();
            } else {
                document.querySelector("#login_message").innerHTML = "エラーが発生しました<br>もう一度お試しください";
                response.text().then((text) => {
                    console.error(text);
                }).catch((error) => {
                    console.error(error);
                });
                resetLogin();
            }
        }).catch((error) => {
            document.querySelector("#login_message").innerHTML = "エラーが発生しました<br>もう一度お試しください";
            console.error(error);
            resetLogin();
        });
    }
    document.querySelector("#login").addEventListener("submit", () => {
        login(document.querySelector("#login_id").value, document.querySelector("#login_password").value);
    });
    document.querySelector("#logout").addEventListener("click", () => {
        localStorage.removeItem("userinfo");
        localStorage.removeItem("chat_log");
        localStorage.removeItem("sound");
        localStorage.removeItem("voice");
        localStorage.removeItem("voice_list");
        document.querySelector("#login").style.display = "";
        document.querySelector("#login").classList.add("fadein");
        document.querySelector("#settings").classList.add("fadeout");
        setTimeout(() => {
            document.querySelector("#settings").style.display = "none";
            document.querySelector("#settings").classList.remove("fadeout");
            window.location.reload();
        }, 499);
    });

    document.querySelector("#settings_button").addEventListener("click", () => {
        document.querySelector("#settings").classList.add("fadein");
        document.querySelector("#settings").style.display = "";
    });
    document.querySelector("#settings_close").addEventListener("click", () => {
        localStorage.setItem("sound", document.querySelector("#sound").checked);
        localStorage.setItem("voice", document.querySelector("#voice").checked);
        localStorage.setItem("voice_select", document.querySelector("#voice_list").value);
        document.querySelector("#settings").classList.add("fadeout");
        setTimeout(() => {
            document.querySelector("#settings").style.display = "none";
            document.querySelector("#settings").classList.remove("fadeout");
        }, 499);
    });

    document.querySelector("#listen_button").addEventListener("click", () => {
        if (document.querySelector("#chat > .message.user > input")) document.querySelector("#chat > .message.user:last-child").remove();
        if (document.querySelector("#chat > .message.user.rec")) return recognition.stop() || sounds[2]();
        const recMessageElement = document.createElement("div");
        recMessageElement.classList.add("message");
        recMessageElement.classList.add("user");
        recMessageElement.classList.add("rec");
        recMessageElement.innerHTML = "<span class=\"shadowExpandX-dot\"></span>";
        document.querySelector("#chat").appendChild(recMessageElement);
        document.querySelector("#chat").scrollTop = document.querySelector("#chat").scrollHeight;
        function onStartRecognition() {
            recMessageElement.innerHTML = "<span class=\"flash-dot\"></span>";
            sounds[0]();
        }
        function onResultRecognition(event) {
            console.log(event)
            if (event.results.length == 0) return;
            const result = event.results[event.results.length - 1];
            if (result.isFinal) {
                recMessageElement.remove();
                const messageElement = document.createElement("div");
                messageElement.classList.add("message");
                messageElement.classList.add("user");
                messageElement.innerHTML = result[0].transcript;
                document.querySelector("#chat").appendChild(messageElement);
                document.querySelector("#chat").scrollTop = document.querySelector("#chat").scrollHeight;
                saveChatLog();
                sounds[1]();
                sendMessage();
                recognition.removeEventListener("start", onStartRecognition);
                recognition.removeEventListener("result", onResultRecognition);
            } else {
                recMessageElement.innerHTML = `${result[0].transcript}<span class="flash-dot"></span>`;
            }
        }
        function onEndRecognition() {
            recMessageElement.remove();
            recognition.removeEventListener("start", onStartRecognition);
            recognition.removeEventListener("result", onResultRecognition);
            recognition.removeEventListener("end", onEndRecognition);
        }
        recognition.addEventListener("start", onStartRecognition);
        recognition.addEventListener("result", onResultRecognition);
        recognition.addEventListener("end", onEndRecognition);
        recognition.start();
    });

    document.querySelector("#keyboard_button").addEventListener("click", () => {
        if (document.querySelector("#chat > .message.user > input")) return document.querySelector("#chat > .message.user > input").focus();
        const inputElement = document.createElement("div");
        inputElement.classList.add("message");
        inputElement.classList.add("user");
        const textElement = document.createElement("input");
        textElement.type = "text";
        inputElement.appendChild(textElement);
        document.querySelector("#chat").appendChild(inputElement);
        textElement.focus();
        textElement.addEventListener("change", () => {
            textElement.blur();
            if (textElement.value == "") return inputElement.remove();
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.classList.add("user");
            messageElement.innerHTML = textElement.value;
            document.querySelector("#chat").appendChild(messageElement);
            inputElement.remove();
            sendMessage();
        });
    });

    updateVoiceList();
    if ('SpeechRecognition' in window) {
    } else {
        document.querySelector("#listen_button").disabled = true;
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.innerHTML = "音声認識がサポートされていません";
        document.querySelector("#chat").appendChild(messageElement);
    }
});
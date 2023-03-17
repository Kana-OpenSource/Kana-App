document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".time").forEach((element) => {
        element.innerHTML = moment(element.children.item(0).innerHTML).locale("ja").fromNow();
    });
    if (localStorage.getItem("userinfo")) {
        login(JSON.parse(localStorage.getItem("userinfo")).id, JSON.parse(localStorage.getItem("userinfo")).password, true);
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
                    if (auto) {
                        document.querySelector("#login").style.display = "none";
                    } else {
                        setTimeout(() => {
                            document.querySelector("#login").classList.add("fadeout");
                            setTimeout(() => {
                                document.querySelector("#login").style.display = "none";
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
});
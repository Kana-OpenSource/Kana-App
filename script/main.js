document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".time").forEach((element) => {
        element.innerHTML = moment(element.children.item(0).innerHTML).locale("ja").fromNow();
    });
    document.querySelector("#login_button").addEventListener("click", () => {
        
    });
});
const meetingActionsEl = document.querySelector(".meeting-actions");
let actionsTimer = setTimeout(() => {
    meetingActionsEl.classList.remove("active");
}, 2500);

window.addEventListener("mousemove",(pos) => {
    if(pos.clientY >= (window.innerHeight - meetingActionsEl.clientHeight) && !meetingActionsEl.classList.contains("active")){
        meetingActionsEl.classList.add("active");
    }
})

meetingActionsEl.addEventListener("mouseout",() => {
    actionsTimer = setTimeout(() => {
        meetingActionsEl.classList.remove("active");
    }, 1500);
})

meetingActionsEl.addEventListener("mouseover",() => {
    clearTimeout(actionsTimer);
})

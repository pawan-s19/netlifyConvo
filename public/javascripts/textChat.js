var socket = io();
var connected = false;
var room = "";
var typingdiv = document.querySelector(".typing");
var flash = document.querySelector(".typing small");
let ctn = document.querySelector(".msgCtn");

var endbtn = document.querySelectorAll("#end");
var selbtn = document.querySelector("#sel");
var txt = document.querySelector("textarea");

var audio = new Audio("/media/messageArrived.mp3");
var joinedAudio = new Audio("/media/joined.mp3");
var leftAudio = new Audio("/media/left.mp3");

var istyping = false;
var timeout = undefined;

socket.emit("inTextChat");

// functions used
let getTime = () => {
  const d = new Date();
  let hour = d.getHours();
  let minutes = d.getMinutes();
  minutes = minutes >= 0 && minutes < 10 ? `0${minutes}` : minutes;
  let ampm = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  hour = hour === 12 || hour === 11 || hour === 10 ? hour : `0${hour}`;
  return { hour, minutes, ampm };
};
function scrollToTop() {
  ctn.scrollTop = ctn.scrollHeight;
}
function typingTimeout() {
  istyping = false;
  socket.emit("typing", { istyping });
}
let flag = (bool) => {
  endbtn.forEach((ele) => {
    bool
      ? (ele.style.pointerEvents = "none")
      : (ele.style.pointerEvents = "auto");
  });
};
// function to open menu on click
var app = function () {
  var body = undefined;
  var menu = undefined;
  var menuItems = undefined;
  var init = function init() {
    body = document.querySelector("body");
    menu = document.querySelector(".menu-icon");
    menuItems = document.querySelectorAll(".nav__list-item");
    applyListeners();
  };
  var applyListeners = function applyListeners() {
    menu.addEventListener("click", function () {
      return toggleClass(body, "nav-active");
    });
  };
  var toggleClass = function toggleClass(element, stringClass) {
    if (element.classList.contains(stringClass))
      element.classList.remove(stringClass);
    else element.classList.add(stringClass);
  };
  init();
};
app();

//Socket ke functions - Start

function msgSender(val) {
  if (val.trim() !== "") {
    socket.emit("message", {
      msgs: val,
      time: getTime(),
    });
    txt.value = "";
    clearTimeout(timeout);
    typingTimeout();
  } else {
    txt.value = "";
  }
}

document.querySelector("#send").addEventListener("click", function () {
  var val = txt.value;
  msgSender(val);
});

txt.addEventListener("keyup", (dets) => {
  if (dets.keyCode === 13) {
    var val = txt.value;
    msgSender(val);
  }
});

// Emit socket while typing
txt.addEventListener("keypress", function (dets) {
  if (dets.keyCode !== 13) {
    istyping = true;
    clearTimeout(timeout);
    timeout = setTimeout(typingTimeout, 1000);
    socket.emit("typing", { istyping });
  }
});

// display user is typing
socket.on("display", function (data) {
  if (data.istyping === true) {
    flash.textContent = `Stranger is typing`;
    typingdiv.style.display = "flex";
  } else {
    flash.textContent = ``;
    typingdiv.style.display = "none";
  }
});

// connected to socket
socket.on("connect", function () {
  connected = true;
  socket.emit("userConnected");
});

// chat started i.e. connected to a new peer
socket.on("chatStart", (data) => {
  ctn.innerHTML = `<h6>${data.msg}</h6>`;
  joinedAudio.play();
  if (data.msg) {
    txt.disabled = false;
    flag(false);
    txt.focus();
  }
});

var count = 0;
var count2 = 0;

// Text message reply appending to msg div
socket.on("reply", function (allData) {
  if (allData.id === socket.id) {
    count2 = 0;
    // align right
    if (count === 0) {
      document.querySelector(
        ".msgCtn"
      ).innerHTML += `<div class="msgWrapper aRight">
          <h6>You, ${allData.data.time.hour}:${allData.data.time.minutes} ${allData.data.time.ampm}</h6>
          <div class="textHolder">
              <div class="triR"></div>
              <h3>${allData.data.msgs}</h3>
          </div>
        </div>`;
      count++;
    } else {
      document.querySelector(
        ".msgCtn"
      ).innerHTML += `<div class="msgWrapper aRight">
        <div class="textHolder">
            <div class="triR"></div>
            <h3>${allData.data.msgs}</h3>
        </div>
      </div>`;
    }
  } else {
    count = 0;
    audio.play();
    // align left
    if (count2 === 0) {
      document.querySelector(".msgCtn").innerHTML += `<div class="msgWrapper">
          <h6>Stranger, ${allData.data.time.hour}:${allData.data.time.minutes} ${allData.data.time.ampm}</h6>
          <div class="textHolder">
              <div class="triL"></div>
              <h3>${allData.data.msgs}</h3>
          </div>
        </div>`;
      count2++;
    } else {
      document.querySelector(".msgCtn").innerHTML += `<div class="msgWrapper">
          <div class="textHolder">
              <div class="triL"></div>
              <h3>${allData.data.msgs}</h3>
          </div>
        </div>`;
    }
  }
  setTimeout(() => {
    let lastMsg = ctn.lastChild;
    lastMsg.style.transform = "scale(1)";
  }, 0000);
  scrollToTop();
});

// getting room name
socket.on("roomName", (roomName) => {
  room = roomName;
});

// Alerting chat end with a message
socket.on("chatEnd", (data) => {
  typingdiv.style.display = "none";
  txt.disabled = true;
  flag(true);
  if (data.msg) {
    leftAudio.play();
    ctn.innerHTML += `<h6>Stranger Disconnected</h6><h5>Waiting for Someone to Connect...</h5>`;
    scrollToTop();
  }
  room = "";
});

// Listen button for ending chat purposely
endbtn.forEach((ele) => {
  ele.addEventListener("click", () => {
    typingdiv.style.display = "none";
    leave_chat();
    ctn.innerHTML += `<h6>You Disconnected</h6><h5>Waiting for Someone to Connect...</h5>`;
    scrollToTop();
  });
});

var leave_chat = function () {
  // call this when user want to end current chat
  if (connected) {
    socket.emit("leaveRoom");
    txt.disabled = true;
    flag(true);
    room = "";
  }
};

// Select all chat text
selbtn.addEventListener("click", () => {
  selectText("msgCtn");
});

// Function to perform text selection
function selectText(ctnClass) {
  var node = document.querySelector(`.${ctnClass}`);

  if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    var range = document.createRange();
    range.selectNodeContents(node);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }

  count = 0;
  count2 = 0;
}
window.addEventListener("resize", () => {
  scrollToTop();
});
// -------------------detect mobile typing------------------
// -------------------detect mobile typing------------------
const getDeviceType = () => {
  const ua = navigator.userAgent;
  console.log(window.navigator);
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    txt.addEventListener("keyup", () => {
      istyping = true;
      clearTimeout(timeout);
      timeout = setTimeout(typingTimeout, 1000);
      socket.emit("typing", { istyping });
    });
    return "mobile";
  }
  return "desktop";
};
getDeviceType();
let outlinetxt = document.querySelectorAll(".msgCtn h5 span");

let i = 0;
setInterval(() => {
  if (i < 4) {
    outlinetxt[i].classList.remove("outlined");
    outlinetxt[i + 1].classList.add("outlined");
    i++;
  } else {
    outlinetxt[i].classList.remove("outlined");
    outlinetxt[0].classList.add("outlined");
    i = 0;
  }
}, 0700);

gsap.from("#room", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "200px",
});
gsap.from("#vid", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "100px",
});
gsap.from(".txt1", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "-100px",
});
gsap.from(".txt2", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "-200px",
});
gsap.from(".logo", {
  duration: 1,
  opacity: 0,
  x: "-100%",
  ease: "power4.inOut",
});
gsap.from(".label", {
  duration: 1,
  opacity: 0,
  x: "100%",
  ease: "power4.inOut",
});
gsap.from(".msgCtn h5", {
  duration: 1,
  opacity: 0,
  y: "-100%",
  ease: "power3.inOut",
});

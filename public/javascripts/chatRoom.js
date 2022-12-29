var socket = io();
var roomtag = document.querySelectorAll(".roomName");
var allUsersCtn = document.querySelectorAll(".allUsersCtn");
var typingdiv = document.querySelector(".typing");
var flash = document.querySelector(".typing small");
var txt = document.querySelector("textarea");
var alertmsg = document.querySelector("pre");
var alertdiv = document.querySelector("#alert");
let ctn = document.querySelector(".msgCtn");
var istyping = false;
var timeout = undefined;

var userName = "default";
var audio = new Audio("/media/messageArrived.mpeg");
var joinedAudio = new Audio("/media/joined.mp3");
var leftAudio = new Audio("/media/left.mp3");

const box2 = document.querySelector("#box2");
const box1 = document.querySelector("#box1");
const participants = document.querySelector(".participants");
const ol = document.querySelector("#popupOverlay");
const popup = document.querySelector("#popup");
var clicked = false;

//for qs setup
var { uname, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
//for qs setup

roomtag.forEach((ele) => {
  ele.textContent = `${room}`;
});

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

socket.emit("joinRoom", { uname, room });

function sender() {
  let msgs = document.querySelector("textarea").value;
  if (msgs.trim() !== "") {
    socket.emit("msg", {
      userName: uname,
      msgs: msgs,
      time: getTime(),
    });
  }
  document.querySelector("textarea").value = "";
  clearTimeout(timeout);
  typingTimeout();
}

function typingTimeout() {
  istyping = false;
  socket.emit("typing", { uname, istyping });
}

// put online user data in popup
function outputUsers(users) {
  var clutter = "";

  users.forEach(function (elem) {
    clutter += `<div class="users">
      <h5>${elem.username}</h5>
      <div class="dot"></div>
    </div>`;
  });

  // document.querySelector(".allUsersCtn").innerHTML = clutter;
  allUsersCtn.forEach((ele) => {
    ele.innerHTML = clutter;
  });
}

function outputOnlineNum(users) {
  document.querySelectorAll(".onlineNum").forEach((ele) => {
    ele.textContent = `${users.length}`;
    if (users.length <= 1) {
      txt.disabled = true;
    } else {
      txt.disabled = false;
    }
  });
}

function alert(data) {
  data.msg === "joined" ? joinedAudio.play() : leftAudio.play();

  alertmsg.textContent = `${data.user} ${data.msg} the chat`;
  document.querySelector("#alert").classList.add("start");
  document.querySelector("#alert").style.display = "block";
  setTimeout(() => {
    document.querySelector("#alert").classList.remove("start");
    document.querySelector("#alert").style.display = "none";
  }, 3000);
}
// functions End

document.querySelector("#send").addEventListener("click", function () {
  sender();
});

document.querySelector("textarea").addEventListener("keyup", function (dets) {
  if (dets.keyCode === 13) {
    sender();
  }
});

// Put Number of users online
socket.on("roomUsers", ({ room, users }) => {
  outputUsers(users);
  outputOnlineNum(users);
});

// Emit socket while typing
document
  .querySelector("textarea")
  .addEventListener("keypress", function (dets) {
    if (dets.keyCode !== 13) {
      istyping = true;
      clearTimeout(timeout);
      timeout = setTimeout(typingTimeout, 1000);
      socket.emit("typing", { uname, istyping });
    }
  });

// display user is typing
socket.on("display", function (data) {
  if (data.istyping === true) {
    flash.textContent = `${data.uname} is typing`;
    typingdiv.style.display = "flex";
  } else {
    flash.textContent = ``;
    typingdiv.style.display = "none";
  }
});

var count = 0;

// Text message reply appending to msg div
socket.on("reply", function (allData) {
  if (allData.id === socket.id) {
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
    document.querySelector(".msgCtn").innerHTML += `<div class="msgWrapper">
          <h6>${allData.data.userName}, ${allData.data.time.hour}:${allData.data.time.minutes} ${allData.data.time.ampm}</h6>
          <div class="textHolder">
              <div class="triL"></div>
              <h3>${allData.data.msgs}</h3>
          </div>
        </div>`;
    audio.play();
  }
  setTimeout(() => {
    let lastMsg = ctn.lastChild;
    lastMsg.style.transform = "scale(1)";
  }, 0000);
  scrollToTop();
});

// alert others that user has left the chat
socket.on("alert", (data) => {
  typingdiv.style.display = "none";
  alert(data);
});

// New styling as per Changes done to update UI ----------------
const removeLeftDiv = () => {
  participants.style.width = "0px";
  participants.style.opacity = "0";
  participants.style.padding = "0px";
  box2.classList.remove("activated");
  box1.classList.add("activated");
};

function myFunction(x) {
  if (x.matches) {
    if (clicked) {
      ol.style.display = "initial";
      popup.classList.add("fadeUp");
    }
  } else {
    ol.style.display = "none";
    if (!clicked) {
      removeLeftDiv();
    }
  }
}

box2.addEventListener("click", () => {
  clicked = true;
  participants.style.width = "300px";
  participants.style.opacity = "1";
  participants.style.padding = "0px 8px";
  box1.classList.remove("activated");
  box2.classList.add("activated");
  if (x.matches) {
    ol.style.display = "initial";
    popup.classList.add("fadeUp");
  }
});

box1.addEventListener("click", () => {
  removeLeftDiv();
  clicked = false;
});

document.querySelector("#back").addEventListener("click", () => {
  removeLeftDiv();
  clicked = false;
});

// for smaller screens condition
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

window.addEventListener("click", (dets) => {
  if (dets.target.id === "popupOverlay") {
    ol.style.display = "none";
    box2.classList.remove("activated");
    box1.classList.add("activated");
    clicked = false;
    popup.classList.remove("fadeUp");
  }
});

var x = window.matchMedia("(max-width: 600px)");
myFunction(x); // Call listener function at run time
x.addListener(myFunction); // Attach listener function on state changes

window.addEventListener("resize", () => {
  scrollToTop();
});
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
      socket.emit("typing", { uname, istyping });
    });
    return "mobile";
  }
  return "desktop";
};
getDeviceType();
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
gsap.from(".tagline", {
  duration: 1,
  opacity: 0,
  y: "-100%",
  ease: "power4.inOut",
});
gsap.from("#room", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  scale: 0,
});
gsap.from("#vid", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  scale: 0,
});
gsap.from("#txt", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  scale: 0,
});

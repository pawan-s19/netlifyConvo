var socket = io();
var peer = new Peer();
var video = document.createElement("video");
var endbtn = document.querySelectorAll("#end");
var selbtn = document.querySelector("#sel");
var localvideo = document.querySelector(".localvideo");
var remotevideo = document.querySelector(".remotevideo");
var loader = document.querySelector("#loader");
var myVideo = document.createElement("video");

var connected = false;
var room = "";

var sendbtn = document.querySelector("#send");
var txt = document.querySelector("textarea");
var ctn = document.querySelector(".msgCtn");
var typingdiv = document.querySelector(".typing");
var flash = document.querySelector(".typing small");

var istyping = false;
var timeout = undefined;

// emit that we are in video chat
socket.emit("inVidChat");

peer.on("open", (peerId) => {
  socket.emit("peerId", peerId);
});

myVideo.muted = true;
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then(function (stream) {
    addVideoStreamLocal(myVideo, stream);
    peer.on("call", (call) => {
      call.answer(stream);
      this.mediaConnection = call;
      call.on("close", () => {
        video.remove();
        console.log("video removed");
      });

      call.on("stream", (userVideoStream) => {
        addVideoStreamRemote(video, userVideoStream);
      });
    });

    socket.on("user-connected", (peerId) => {
      connectToNewUser(peerId, stream);
    });
  });

//Socket ke functions - Start
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
let flag = (bool) => {
  endbtn.forEach((ele) => {
    bool
      ? (ele.style.pointerEvents = "none")
      : (ele.style.pointerEvents = "auto");
  });
};
function scrollToBottom() {
  ctn.scrollTop = ctn.scrollHeight;
}
function typingTimeout() {
  istyping = false;
  socket.emit("typing", { istyping });
}
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
let leave_chat = () => {
  // call this when user want to end current chat
  if (connected) {
    socket.emit("leaveRoom");
    txt.disabled = true;
    flag(true);
    room = "";
  }
};

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
//Socket ke functions - End

//---------Socket ka code emition vagehra---------

// connected to socket
socket.on("connect", function () {
  connected = true;
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

sendbtn.addEventListener("click", () => {
  var val = txt.value;
  msgSender(val);
});

socket.on("chatStart", (data) => {
  ctn.innerHTML = `<h6>${data.msg}</h6>`;
  if (data.msg) {
    txt.disabled = false;
    flag(false);
    txt.focus();
  }
});

var count = 0;
var count2 = 0;

// Text message reply appending to msg div
socket.on("replyMessage", function (allData) {
  if (allData.id === socket.id) {
    count2 = 0;
    // align right
    if (count === 0) {
      ctn.innerHTML += `<div class="msgWrapper aRight">
          <h6>You, ${allData.data.time.hour}:${allData.data.time.minutes} ${allData.data.time.ampm}</h6>
          <div class="textHolder">
              <div class="triR"></div>
              <h3>${allData.data.msgs}</h3>
          </div>
        </div>`;
      count++;
    } else {
      ctn.innerHTML += `<div class="msgWrapper aRight">
        <div class="textHolder">
            <div class="triR"></div>
            <h3>${allData.data.msgs}</h3>
        </div>
      </div>`;
    }
  } else {
    count = 0;
    // align left
    if (count2 === 0) {
      ctn.innerHTML += `<div class="msgWrapper">
          <h6>Stranger, ${allData.data.time.hour}:${allData.data.time.minutes} ${allData.data.time.ampm}</h6>
          <div class="textHolder">
              <div class="triL"></div>
              <h3>${allData.data.msgs}</h3>
          </div>
        </div>`;
      count2++;
    } else {
      ctn.innerHTML += `<div class="msgWrapper">
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
  scrollToBottom();
});

// Alerting chat end with a message
socket.on("chatEnd", (data) => {
  typingdiv.style.display = "none";
  txt.disabled = true;
  flag(true);
  if (data.msg) {
    ctn.innerHTML += `<h6>Stranger Disconnected</h6><h5>Waiting for Someone to Connect...</h5>`;
    scrollToBottom();
  }
  room = "";
});

// Listen button for ending chat purposely
endbtn.forEach((ele) => {
  ele.addEventListener("click", () => {
    typingdiv.style.display = "none";
    leave_chat();
    loader.style.display = "block";
    ctn.innerHTML += `<h6>You Disconnected</h6><h5>Waiting for Someone to Connect...</h5>`;
    scrollToBottom();
  });
});

// Select all chat text
selbtn.addEventListener("click", () => {
  selectText("msgCtn");
});

//------------Peer ka bacha hua code-----------
socket.on("user-disconnected", (peerId) => {
  this.mediaConnection.close();
  loader.style.display = "block";
});

function addVideoStreamLocal(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  localvideo.append(video);
}
function addVideoStreamRemote(video, stream) {
  video.srcObject = stream;

  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  loader.style.display = "none";
  remotevideo.append(video);
}
function connectToNewUser(userId, stream) {
  var call = peer.call(userId, stream);
  this.mediaConnection = call;

  call.on("stream", (userVideoStream) => {
    addVideoStreamRemote(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });
}
window.addEventListener("resize", () => {
  scrollToBottom();
});
// -------------------detect mobile typing------------------
// -------------------detect mobile typing------------------
const getDeviceType = () => {
  const ua = navigator.userAgent;

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

let iterator = 0;
setInterval(() => {
  if (iterator < 4) {
    outlinetxt[iterator].classList.remove("outlined");
    outlinetxt[iterator + 1].classList.add("outlined");
    iterator++;
  } else {
    outlinetxt[iterator].classList.remove("outlined");
    outlinetxt[0].classList.add("outlined");
    iterator = 0;
  }
}, 0700);
gsap.from("#room", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "200px",
});
gsap.from("#txt", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "100px",
});
gsap.from("#btn3", {
  duration: 1,
  opacity: 0,
  rotate: 90,
  ease: "power1.inOut",
  y: "-100px",
});
gsap.from("#btn4", {
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

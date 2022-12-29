var inp = document.querySelector("#name");
var select = document.querySelector("#select");
var formBtn = document.querySelector("#valBtn");
var form = document.querySelector("#form");
const liveToast = document.querySelector("#liveToast");
let toastTime = document.querySelector("#toastTime");
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
function isEmpty() {
  inp.value = "";
  const toast = new bootstrap.Toast(liveToast);
  let { hour, minutes, ampm } = getTime();
  toastTime.textContent = `${hour}:${minutes} ${ampm}`;
  toast.show();
}

formBtn.addEventListener("click", () => {
  if (inp.value.trim() !== "") {
    form.submit();
  } else {
    isEmpty();
  }
});
form.addEventListener("submit", function (e) {
  if (inp.value.trim() === "") {
    e.preventDefault();
    isEmpty();
  } else {
    form.submit();
  }
});

// Press h to return to home page
window.addEventListener("keypress", (e) => {
  if (e.target.tagName === "BODY") {
    if (e.key.toLowerCase() === "h") {
      window.location.assign("/");
    }
  }
});

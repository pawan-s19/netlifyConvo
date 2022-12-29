let checkboxes = document.querySelectorAll(".large");
let checkbox1 = document.querySelector("#checkbox1");
let checkbox2 = document.querySelector("#checkbox2");
let button = document.querySelector("button");
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("click", () => {
    if (checkbox1.checked && checkbox2.checked) {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then(function (stream) {
          if (checkbox1.checked && checkbox2.checked) {
            button.style.pointerEvents = "auto";
            button.style.opacity = "1";
          }
        })
        .catch(function () {
          alert("please allow camera permissions");
        });
    }
  });
});
document.querySelector("#test").addEventListener("submit", () => {
  window.location.reload();
});
gsap.from("form", {
  scale: 0,
  duration: 1,
  opacity: 0,
  ease: "back.inOut(3)",
});

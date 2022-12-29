// var permitBtn = document.querySelector("#permitBtn");
// const liveToast = document.querySelector('#liveToast');

// permitBtn.addEventListener("click", () => {
//     navigator.mediaDevices.getUserMedia({ audio: true, video: false })
//     .then(function(){
//         window.location.assign('/videoChat')
//     })
//     .catch(function(){
//         const toast = new bootstrap.Toast(liveToast);
//         toast.show();
//     })
// });

gsap.from(".txtanim", {
  duration: 0.8,
  opacity: 0,
  ease: Expo.easeInOut,
  y: 20,
  stagger: 0.5,
});
gsap.from(".btn", {
  duration: 0.3,
  opacity: 0,
  ease: "easeInOut",
  delay: 1.2,
  y: 15,
  stagger: 0.2,
});

firebase.initializeApp({
  apiKey: "AIzaSyDf64ttRcxVtyv_xhb06bHopD1kUiFJI9Y",
  authDomain: "hilmicode-comment.firebaseapp.com",
  projectId: "hilmicode-comment",
  storageBucket: "hilmicode-comment.firebasestorage.app",
  messagingSenderId: "1071939766625",
  appId: "1:1071939766625:web:4e726f7be1bac71844dd20",
  measurementId: "G-Y6GL3EBMKY"
});
const db = firebase.firestore();

function formatShortNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

const btn = document.getElementById("play-music");
const audio = document.getElementById("musik");
const icon = document.getElementById("music-icon");
const label = document.getElementById("music-label");

btn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    icon.src = "pause_bt.svg";
    label.textContent = "Pause Music";
  } else {
    audio.pause();
    icon.src = "play_bt.svg";
    label.textContent = "Play Music";
  }
});

function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  document.getElementById("clock").textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

function updateStats() {
  const cpu = Math.floor(Math.random() * 50) + 10;
  const ram = Math.floor(Math.random() * 80) + 10;
  const storage = Math.floor(Math.random() * 90) + 5;
  document.getElementById("cpu").textContent = cpu + "%";
  document.getElementById("ram").textContent = ram + "%";
  document.getElementById("storage").textContent = storage + "%";
}
setInterval(updateStats, 3000);
updateStats();

function updateWeather() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const temp = data.current_weather.temperature;
        document.getElementById("weather").innerHTML = `
          <span style="display: flex; align-items: center; gap: 6px;">
            <img src="temp.svg" alt="Temperature" style="width: 20px; height: 20px;">
            ${temp}°C
          </span>`;
      } catch {
        document.getElementById("weather").textContent = "Failed to Load Weather";
      }
    }, () => {
      document.getElementById("weather").textContent = "Failed to Load Weather";
    });
  } else {
    document.getElementById("weather").textContent = "Geolocation Not Supported";
  }
}
updateWeather();

const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");

commentInput.addEventListener("focus", () => {
  if (!localStorage.getItem("username")) {
    const inputName = prompt("Enter your username:") || "Anonymous";
    localStorage.setItem("username", inputName);
  }
});

document.getElementById("submitComment").addEventListener("click", submitComment);
commentInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && commentInput.value.trim()) {
    submitComment();
  }
});

function submitComment() {
  const username = localStorage.getItem("username") || "Anonymous";
  const commentText = commentInput.value.trim();
  if (!commentText) return;

  db.collection("comments").add({
    username,
    comment: commentText,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  
  // Cek dan jalankan fitur tersembunyi dengan px wajib
  const blurMatch = commentText.match(/^backdrop-filter:blur\((reset|\d+px)\)$/);
  if (blurMatch) {
    const val = blurMatch[1] === 'reset' ? 'reset' : blurMatch[1].replace('px', '');
    updateBackdropBlur(val);
  }

  commentInput.value = "";
}

db.collection("comments").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
  commentList.innerHTML = "";
  const currentUsername = (localStorage.getItem("username") || "Anonymous").trim().toLowerCase();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const comment = document.createElement("div");
    comment.className = "comment-item";

    const text = document.createElement("span");
    text.style.display = "inline";

    const usernameEl = document.createElement("strong");
    usernameEl.className = "username";
    usernameEl.textContent = data.username + ": ";

    const commentEl = document.createElement("span");
    commentEl.className = "comment-text";
    const urlified = data.comment.replace(/\b((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{1,63}(\/[^\"]*)?)/gi, match => {
      const href = match.startsWith("http") ? match : `https://${match}`;
      return `<a href="${href}" target="_blank" style="color:#FFFFFF;text-decoration:underline;">${match}</a>`;
    });
    commentEl.innerHTML = urlified;

    text.appendChild(usernameEl);
    text.appendChild(commentEl);

    const actions = document.createElement("span");
    actions.className = "comment-actions";

    const likeBtn = document.createElement("button");
    const likeImg = document.createElement("img");
    likeImg.src = "like_bt.svg";
    likeImg.alt = "Like";
    likeImg.style.width = likeImg.style.height = "20px";
    likeBtn.appendChild(likeImg);

    const likeCountSpan = document.createElement("span");
    likeCountSpan.className = "like-count";
    likeCountSpan.style.marginLeft = "5px";
    likeCountSpan.textContent = "0";

    const userId = (localStorage.getItem("username") || "Anonymous").trim();
    const likeRef = db.collection("comments").doc(doc.id).collection("likes").doc(userId);

    db.collection("comments").doc(doc.id).collection("likes")
      .onSnapshot(likeSnap => {
        likeCountSpan.textContent = formatShortNumber(likeSnap.size);
      });

    likeBtn.addEventListener("click", async () => {
      const likeDoc = await likeRef.get();
      if (likeDoc.exists) {
        await likeRef.delete();
      } else {
        await likeRef.set({ likedAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
    });

    const deleteBtn = document.createElement("button");
    const deleteImg = document.createElement("img");
    deleteImg.src = "delete_bt.svg";
    deleteImg.alt = "Delete";
    deleteImg.style.width = deleteImg.style.height = "20px";
    deleteBtn.appendChild(deleteImg);

    const isOwnerOrAdmin = currentUsername === data.username.toLowerCase() || currentUsername === "hilmibiji" || currentUsername === "admin";
    if (isOwnerOrAdmin) {
      deleteBtn.addEventListener("click", () => {
        db.collection("comments").doc(doc.id).delete();
      });
    } else {
      deleteBtn.style.opacity = "0.3";
      deleteBtn.style.pointerEvents = "none";
    }

    actions.appendChild(likeBtn);
    actions.appendChild(likeCountSpan);
    actions.appendChild(deleteBtn);

    comment.appendChild(text);
    comment.appendChild(actions);
    commentList.appendChild(comment);
  });
});

const emojiBtnBtn = document.getElementById("emojiBtn");
const emojiBtnImg = emojiBtnBtn.querySelector("img");
emojiBtnImg.src = "emoji_bt.svg";

const emojiList = ["😁", "😂", "🤣", "😃", "😄", "😆", "😅", "😊", "😍", "😘", "😗", "😋", "😎", "🤩", "😜", "😝", "🤑", "🤗", "🤔", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "😯", "😪", "😫", "😴", "😌", "😛", "😺", "😸", "😹", "👍", "🔥", "✨", "🎉", "💯"];

emojiBtnBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const randomIndex = Math.floor(Math.random() * emojiList.length);
  commentInput.value = emojiList[randomIndex];
  commentInput.blur();
});

const popupAbout = document.getElementById("popupAbout");
const popupVoila = document.getElementById("popupVoila");
const popupPaypal = document.getElementById("popupPaypal");

document.querySelectorAll(".taskbar-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const label = btn.textContent.trim();
    popupAbout.style.display = (label === "About") ? togglePopup(popupAbout) : "none";
    popupVoila.style.display = label.includes("Voila") ? togglePopup(popupVoila) : "none";
    popupPaypal.style.display = (label === "PayPal") ? togglePopup(popupPaypal) : "none";
  });
});

function togglePopup(popup) {
  return popup.style.display === "none" || popup.style.display === "" ? "block" : "none";
}

document.addEventListener("click", function (e) {
  if (!e.target.closest(".popup") && !e.target.closest(".taskbar-btn")) {
    popupAbout.style.display = "none";
    popupVoila.style.display = "none";
    popupPaypal.style.display = "none";
  }
});

const kotakRasio = document.querySelector('.kotak-rasio');
let startX = 0;
let isSwiping = false;

kotakRasio.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  isSwiping = true;
});

kotakRasio.addEventListener('touchmove', (e) => {
  if (!isSwiping) return;
  const diffX = e.touches[0].clientX - startX;

  if (diffX > 80 && !kotakRasio.classList.contains('rotate-right')) {
    kotakRasio.classList.remove('rotate-left');
    kotakRasio.classList.add('rotate-right');
    isSwiping = false;
  } else if (diffX < -80 && !kotakRasio.classList.contains('rotate-left')) {
    kotakRasio.classList.remove('rotate-right');
    kotakRasio.classList.add('rotate-left');
    isSwiping = false;
  }
});

kotakRasio.addEventListener('touchend', () => {
  isSwiping = false;
});

const gameBtn = document.getElementById("ai-btn");
let gameActive = false;

gameBtn.addEventListener("click", () => {
  kotakRasio.innerHTML = gameActive ? '' : '<iframe src="content/v86js.html" style="width:100%;height:100%;border:none;border-radius:16px;"></iframe>';
  gameActive = !gameActive;
});

function updateBackdropBlur(value) {
  const defaultBlur = '12px';
  const blurValue = value === 'reset' ? defaultBlur : `${value}px`;
  document.querySelectorAll('.kotak-rasio, .interaction-panel, .taskbar, .taskbar-main-top, .popup, .stats-panel').forEach(el => {
    el.style.backdropFilter = `blur(${blurValue})`;
  });
}

window.addEventListener("online", () => {
  updateWeather();
});

let weatherInterval = setInterval(() => {
  const weatherEl = document.getElementById("weather");
  if (weatherEl && (!weatherEl.textContent || weatherEl.textContent.includes("Failed"))) {
    updateWeather();
  }
}, 15000);

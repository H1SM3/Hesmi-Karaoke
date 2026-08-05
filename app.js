// Конфигурация Firebase для hesmi-s-ka
const firebaseConfig = {
  apiKey: "AIzaSyDnvuUymrsZt7nucZXdagbt4yQlMQm_2qQ",
  authDomain: "hesmi-s-ka.firebaseapp.com",
  projectId: "hesmi-s-ka",
  storageBucket: "hesmi-s-ka.firebasestorage.app",
  messagingSenderId: "410747085984",
  appId: "1:410747085984:web:f0ae7f01c9d9c7e4c095c5"
};

// Инициализация сервисов Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Элементы DOM
const authBtn = document.getElementById('auth-btn');
const audioPlayer = document.getElementById('audio-player');
const trackTitle = document.getElementById('track-title');
const trackList = document.getElementById('track-list');
const lyricsContainer = document.getElementById('lyrics-container');
const uploadSection = document.getElementById('upload-section');
const uploadForm = document.getElementById('upload-form');
const uploadBtn = document.getElementById('upload-btn');

let currentLyrics = [];

// Google Auth
authBtn.addEventListener('click', () => {
  if (auth.currentUser) {
    auth.signOut();
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }
});

// Отслеживание входа
auth.onAuthStateChanged(user => {
  if (user) {
    authBtn.textContent = Выйти (${user.displayName.split(' ')[0]});
    uploadSection.style.display = 'block';
    loadTracks();
  } else {
    authBtn.textContent = 'Войти через Google';
    uploadSection.style.display = 'none';
    trackList.innerHTML = '<li>Авторизуйтесь, чтобы увидеть треки</li>';
  }
});

// Загрузка песен
async function loadTracks() {
  trackList.innerHTML = '';
  try {
    const snapshot = await db.collection('tracks').get();
    
    if (snapshot.empty) {
      trackList.innerHTML = '<li>Список пока пуст. Добавьте первую песню!</li>';
      return;
    }

    snapshot.forEach(doc => {
      const track = doc.data();
      const li = document.createElement('li');
      li.textContent = ${track.artist} - ${track.title};
      li.onclick = () => playTrack(track);
      trackList.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    trackList.innerHTML = '<li>Ошибка при загрузке треков</li>';
  }
}

// Воспроизведение
function playTrack(track) {
  trackTitle.textContent = ${track.artist} - ${track.title};
  audioPlayer.src = track.audioUrl;
  audioPlayer.play();

  parseLRC(track.lrcText);
}

// Парсинг LRC
function parseLRC(lrcText) {
  currentLyrics = [];
  lyricsContainer.innerHTML = '';
  
  if (!lrcText) {
    lyricsContainer.innerHTML = '<p class="lyric-line active">Текст отсутствует</p>';
    return;
  }

  const lines = lrcText.split('\n');
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = timeReg.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const time = minutes * 60 + seconds + milliseconds / (match[3].length === 3 ? 1000 : 100);
      const text = line.replace(timeReg, '').trim();

      if (text) {
        const p = document.createElement('p');
        p.className = 'lyric-line';
        p.textContent = text;
        p.dataset.time = time;
        lyricsContainer.appendChild(p);
        currentLyrics.push({ time, element: p });
      }
    }
  });
}

// Синхронизация текста
audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;
  
  for (let i = currentLyrics.length - 1; i >= 0; i--) {
    if (currentTime >= currentLyrics[i].time) {
      document.querySelectorAll('.lyric-line').forEach(el => el.classList.remove('active'));
      currentLyrics[i].element.classList.add('active');
      currentLyrics[i].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    }
  }
});

// Отправка формы загрузки
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();const artist = document.getElementById('artist-input').value;
  const title = document.getElementById('title-input').value;
  const audioFile = document.getElementById('audio-file').files[0];
  const lrcText = document.getElementById('lrc-input').value;

  if (!audioFile) return;

  try {
    uploadBtn.textContent = 'Загружаем...';
    uploadBtn.disabled = true;

    // 1. Загрузка в Storage
    const storageRef = storage.ref(tracks/${Date.now()}_${audioFile.name});
    const snapshot = await storageRef.put(audioFile);
    const audioUrl = await snapshot.ref.getDownloadURL();

    // 2. Сохранение в Firestore
    await db.collection('tracks').add({
      artist: artist,
      title: title,
      audioUrl: audioUrl,
      lrcText: lrcText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert('Трек успешно загружен, Гусь! 🚀');
    uploadForm.reset();
    loadTracks();
  } catch (error) {
    console.error(error);
    alert('Ошибка загрузки: ' + error.message);
  } finally {
    uploadBtn.textContent = 'Загрузить трек';
    uploadBtn.disabled = false;
  }
});

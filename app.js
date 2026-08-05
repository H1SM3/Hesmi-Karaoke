// Добавление нового трека (загрузка файла в Storage и метаданных в Firestore)
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const artist = document.getElementById('artist-input').value;
  const title = document.getElementById('title-input').value;
  const audioFile = document.getElementById('audio-file').files[0];
  const lrcText = document.getElementById('lrc-input').value;

  if (!audioFile) return;

  try {
    uploadBtn.textContent = 'Загружаем...';
    uploadBtn.disabled = true;

    // 1. Загружаем MP3 файл в Firebase Storage
    const storageRef = storage.ref(tracks/${Date.now()}_${audioFile.name});
    const snapshot = await storageRef.put(audioFile);
    const audioUrl = await snapshot.ref.getDownloadURL();

    // 2. Сохраняем информацию в Firestore
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

const DEFAULT_ARTWORKS = [
  {
    title: "広島大学中央図書館",
    lat: 34.403244, 
    lng: 132.713469,
    image: "higashihiroshima.jpeg",
    description: "広島大学東広島キャンパスの中央図書館です。"
  }
];

const THRESHOLD_METERS = 50; // 50m以内で表示

const status = document.getElementById('status');
const artworkDiv = document.getElementById('artwork');
const artTitle = document.getElementById('art-title');
const artImage = document.getElementById('art-image');
const artAudio = document.getElementById('art-audio');
const artDescription = document.getElementById('art-description');
const mapSection = document.getElementById('map-section');
const postSection = document.getElementById('post-section');
const tabMap = document.getElementById('tab-map');
const tabPost = document.getElementById('tab-post');

let map;
let userLat;
let userLng;
let artworks = [];

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function showError(err) {
  status.textContent = `位置情報を取得できません: ${err.message}`;
}

tabMap.addEventListener('click', () => {
  mapSection.classList.remove('hidden');
  postSection.classList.add('hidden');
  tabMap.classList.add('active');
  tabPost.classList.remove('active');
  if (map) {
    setTimeout(() => map.invalidateSize(), 0);
  }
});

tabPost.addEventListener('click', () => {
  mapSection.classList.add('hidden');
  postSection.classList.remove('hidden');
  tabPost.classList.add('active');
  tabMap.classList.remove('active');
});

if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    userLat = latitude;
    userLng = longitude;
    map = L.map('map').setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([latitude, longitude]).addTo(map).bindPopup('現在地').openPopup();
    const storedArtworks = JSON.parse(localStorage.getItem('userArtworks') || '[]');
    artworks = DEFAULT_ARTWORKS.concat(storedArtworks);
    artworks.forEach(a => {
      L.marker([a.lat, a.lng]).addTo(map).bindPopup(a.title);
    });
    displayNearby();
  }, showError);
} else {
  status.textContent = "このブラウザは位置情報に対応していません。";
}

function displayNearby() {
  const nearby = artworks.find(a => distanceMeters(userLat, userLng, a.lat, a.lng) < THRESHOLD_METERS);
  if (nearby) {
    status.textContent = "ようこそ！";
    artTitle.textContent = nearby.title;
    if (nearby.type === 'audio') {
      artImage.classList.add('hidden');
      artAudio.classList.remove('hidden');
      artAudio.src = nearby.data;
    } else {
      artAudio.classList.add('hidden');
      artImage.classList.remove('hidden');
      artImage.src = nearby.image || nearby.data;
    }
    artDescription.textContent = nearby.description || '';
    artworkDiv.classList.remove('hidden');
  } else {
    status.textContent = "この場所では作品を閲覧できません。指定された地点に行ってください。";
    artworkDiv.classList.add('hidden');
  }
}

document.getElementById('post-btn').addEventListener('click', () => {
  const title = document.getElementById('new-title').value.trim();
  const file = document.getElementById('new-file').files[0];
  if (!title || !file || userLat == null) return;
  const reader = new FileReader();
  reader.onload = () => {
    const newArt = {
      title,
      lat: userLat,
      lng: userLng,
      data: reader.result,
      type: file.type.startsWith('audio') ? 'audio' : 'image'
    };
    const stored = JSON.parse(localStorage.getItem('userArtworks') || '[]');
    stored.push(newArt);
    localStorage.setItem('userArtworks', JSON.stringify(stored));
    artworks.push(newArt);
    L.marker([newArt.lat, newArt.lng]).addTo(map).bindPopup(newArt.title);
    displayNearby();
    alert('投稿しました');
  };
  reader.readAsDataURL(file);
});

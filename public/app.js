const DEFAULT_ARTWORKS = [
  {
    title: "広島大学中央図書館",
    lat: 34.403244,
    lng: 132.713469,
    image: "higashihiroshima.jpeg",
    description: "広島大学東広島キャンパスの中央図書館です。",
    type: 'image'
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
const locModeInputs = document.getElementsByName('loc-mode');
const searchBox = document.getElementById('search-box');
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const searchStatus = document.getElementById('search-status');

const imageIcon = L.divIcon({ html: '🖼️', className: 'media-marker', iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
const audioIcon = L.divIcon({ html: '🎵', className: 'media-marker', iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });

let map;
let userLat;
let userLng;
let artworks = [];
let selectedLat;
let selectedLng;
let searchMarker;

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

for (const input of locModeInputs) {
  input.addEventListener('change', () => {
    if (document.querySelector('input[name="loc-mode"]:checked').value === 'search') {
      searchBox.classList.remove('hidden');
    } else {
      searchBox.classList.add('hidden');
    }
  });
}

searchBtn.addEventListener('click', () => {
  const query = locationInput.value.trim();
  if (!query) return;
  searchStatus.textContent = '検索中...';
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        selectedLat = parseFloat(data[0].lat);
        selectedLng = parseFloat(data[0].lon);
        searchStatus.textContent = data[0].display_name;
        if (searchMarker) {
          map.removeLayer(searchMarker);
        }
        searchMarker = L.marker([selectedLat, selectedLng]).addTo(map).bindPopup(data[0].display_name).openPopup();
        map.setView([selectedLat, selectedLng], 15);
      } else {
        searchStatus.textContent = '場所が見つかりません';
      }
    })
    .catch(() => {
      searchStatus.textContent = '検索エラー';
    });
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
    L.circleMarker([latitude, longitude], {
      radius: 8,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.5
    }).addTo(map).bindPopup('現在地').openPopup();
    const storedArtworks = JSON.parse(localStorage.getItem('userArtworks') || '[]');
    artworks = DEFAULT_ARTWORKS.concat(storedArtworks);
    artworks.forEach(a => {
      const icon = a.type === 'audio' ? audioIcon : imageIcon;
      const popupContent = `${a.title} ${a.type === 'audio' ? '🎵' : '🖼️'}`;
      L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(popupContent);
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
  const mode = document.querySelector('input[name="loc-mode"]:checked').value;
  let lat;
  let lng;
  if (mode === 'current') {
    lat = userLat;
    lng = userLng;
  } else {
    lat = selectedLat;
    lng = selectedLng;
  }
  if (!title || !file || lat == null || lng == null) return;
  const reader = new FileReader();
  reader.onload = () => {
    const newArt = {
      title,
      lat,
      lng,
      data: reader.result,
      type: file.type.startsWith('audio') ? 'audio' : 'image'
    };
    const stored = JSON.parse(localStorage.getItem('userArtworks') || '[]');
    stored.push(newArt);
    localStorage.setItem('userArtworks', JSON.stringify(stored));
    artworks.push(newArt);
    const icon = newArt.type === 'audio' ? audioIcon : imageIcon;
    const popupContent = `${newArt.title} ${newArt.type === 'audio' ? '🎵' : '🖼️'}`;
    L.marker([newArt.lat, newArt.lng], { icon }).addTo(map).bindPopup(popupContent);
    displayNearby();
    alert('投稿しました');
  };
  reader.readAsDataURL(file);
});

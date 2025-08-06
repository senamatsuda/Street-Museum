const translations = {
  ja: {
    title: "街角ミュージアム",
    map: "マップ",
    post: "投稿",
    postArtwork: "作品を投稿",
    newTitlePlaceholder: "タイトル",
    useCurrentLocation: "現在地を使用",
    searchByPlace: "場所名で検索",
    searchLocationPlaceholder: "場所を検索",
    searchButton: "検索",
    postButton: "投稿",
    checkingLocation: "現在地を確認しています...",
    selectResult: "検索結果を選択してください",
    searching: "検索中...",
    noLocationsFound: "場所が見つかりません",
    searchError: "検索エラー",
    clickNearby: "近くのマーカーをクリックすると作品を表示します。",
    noLocationSupport: "このブラウザは位置情報取得をサポートしていません。",
    unableToRetrieve: "位置情報を取得できません:",
    currentLocation: "現在地",
    welcome: "ようこそ！",
    moveToView: "指定された場所に移動して作品を表示してください。",
    postedSuccessfully: "投稿に成功しました"
  },
  en: {
    title: "Street Museum",
    map: "Map",
    post: "Post",
    postArtwork: "Post Artwork",
    newTitlePlaceholder: "Title",
    useCurrentLocation: "Use current location",
    searchByPlace: "Search by place name",
    searchLocationPlaceholder: "Search location",
    searchButton: "Search",
    postButton: "Post",
    checkingLocation: "Checking current location...",
    selectResult: "Select a result",
    searching: "Searching...",
    noLocationsFound: "No locations found",
    searchError: "Search error",
    clickNearby: "Click nearby markers to view artworks.",
    noLocationSupport: "This browser does not support geolocation.",
    unableToRetrieve: "Unable to retrieve location:",
    currentLocation: "Current location",
    welcome: "Welcome!",
    moveToView: "Move to the specified location to view the artwork.",
    postedSuccessfully: "Posted successfully"
  }
};

let currentLang = 'ja';
function t(key) {
  return translations[currentLang][key];
}

function getTitle(a) {
  return typeof a.title === 'string' ? a.title : (a.title[currentLang] || a.title.ja || a.title.en);
}
function getDescription(a) {
  if (!a.description) return '';
  return typeof a.description === 'string' ? a.description : (a.description[currentLang] || a.description.ja || a.description.en || '');
}

let currentStatusKey = 'checkingLocation';
let currentStatusExtra = '';
function setStatus(key, extra = '') {
  currentStatusKey = key;
  currentStatusExtra = extra;
  status.textContent = t(key) + extra;
}

function updateTexts() {
  document.documentElement.lang = currentLang;
  document.title = t('title');
  document.getElementById('title').textContent = t('title');
  tabMap.textContent = t('map');
  tabPost.textContent = t('post');
  document.getElementById('post-artwork').textContent = t('postArtwork');
  document.getElementById('new-title').placeholder = t('newTitlePlaceholder');
  document.getElementById('label-use-current').textContent = t('useCurrentLocation');
  document.getElementById('label-search-by-place').textContent = t('searchByPlace');
  document.getElementById('location-input').placeholder = t('searchLocationPlaceholder');
  searchBtn.textContent = t('searchButton');
  document.getElementById('post-btn').textContent = t('postButton');
  setStatus(currentStatusKey, currentStatusExtra);
  if (userMarker) {
    userMarker.bindPopup(t('currentLocation'));
  }
  artworks.forEach(a => {
    if (a.marker) {
      a.marker.bindPopup(getTitle(a));
    }
  });
}

document.getElementById('language-select').addEventListener('change', e => {
  currentLang = e.target.value;
  updateTexts();
});

const DEFAULT_ARTWORKS = [
  {
    title: {
      ja: "広島大学中央図書館",
      en: "Hiroshima University Central Library"
    },
    lat: 34.403244,
    lng: 132.713469,
    image: "higashihiroshima.jpeg",
    description: {
      ja: "広島大学東広島キャンパスの中央図書館です。",
      en: "Central library at Hiroshima University's Higashihiroshima Campus."
    },
    type: 'image'
  }
];

const THRESHOLD_METERS = 50; // display within 50m

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
const searchResults = document.getElementById('search-results');

const imageIcon = L.divIcon({
  html: '🖼️',
  className: 'media-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});
const audioIcon = L.divIcon({
  html: '🎵',
  className: 'media-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

let map;
let userLat;
let userLng;
let artworks = [];
let selectedLat;
let selectedLng;
let searchMarker;
let userMarker;

window.addEventListener('resize', () => {
  if (map) {
    setTimeout(() => map.invalidateSize(), 0);
  }
});

function initMap(lat, lng, showUserMarker = false) {
  map = L.map('map').setView([lat, lng], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
    opacity: 0.5
  }).addTo(map);
  const storedArtworks = JSON.parse(localStorage.getItem('userArtworks') || '[]');
  artworks = DEFAULT_ARTWORKS.concat(storedArtworks);
  artworks.forEach(a => {
    const icon = a.type === 'audio' ? audioIcon : imageIcon;
    const marker = L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(getTitle(a));
    a.marker = marker;
    marker.on('click', () => showArtwork(a));
  });
  if (showUserMarker) {
    userMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.5
    }).addTo(map).bindPopup(t('currentLocation')).openPopup();
  }
  setStatus('clickNearby');
  // Ensure map tiles render correctly on initial load
  setTimeout(() => map.invalidateSize(), 0);
}

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
  setStatus('unableToRetrieve', ' ' + err.message);
  const def = DEFAULT_ARTWORKS[0];
  userLat = def.lat;
  userLng = def.lng;
  initMap(def.lat, def.lng);
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
  searchStatus.textContent = t('searching');
  searchResults.innerHTML = '';
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        selectedLat = null;
        selectedLng = null;
        searchStatus.textContent = t('selectResult');
        data.slice(0, 5).forEach(result => {
          const li = document.createElement('li');
          li.textContent = result.display_name;
          li.addEventListener('click', () => {
            selectedLat = parseFloat(result.lat);
            selectedLng = parseFloat(result.lon);
            searchStatus.textContent = `${t('selectResult')} ${result.display_name}`;
            if (searchMarker) {
              map.removeLayer(searchMarker);
            }
            searchMarker = L.marker([selectedLat, selectedLng]).addTo(map).bindPopup(result.display_name).openPopup();
            map.setView([selectedLat, selectedLng], 15);
            for (const child of searchResults.children) {
              child.classList.remove('selected');
            }
            li.classList.add('selected');
          });
          searchResults.appendChild(li);
        });
      } else {
        searchStatus.textContent = t('noLocationsFound');
      }
    })
    .catch(() => {
      searchStatus.textContent = t('searchError');
    });
});

if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    userLat = latitude;
    userLng = longitude;
    initMap(latitude, longitude, true);
  }, showError);
} else {
  const def = DEFAULT_ARTWORKS[0];
  userLat = def.lat;
  userLng = def.lng;
  setStatus('noLocationSupport');
  initMap(def.lat, def.lng);
}

function showArtwork(art) {
  const within = distanceMeters(userLat, userLng, art.lat, art.lng) < THRESHOLD_METERS;
  if (within) {
    setStatus('welcome');
    artTitle.textContent = getTitle(art);
    if (art.type === 'audio') {
      artImage.classList.add('hidden');
      artAudio.classList.remove('hidden');
      artAudio.src = art.data;
    } else {
      artAudio.classList.add('hidden');
      artImage.classList.remove('hidden');
      artImage.src = art.image || art.data;
    }
    artDescription.textContent = getDescription(art);
    artworkDiv.classList.remove('hidden');
  } else {
    setStatus('moveToView');
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
    const marker = L.marker([newArt.lat, newArt.lng], { icon }).addTo(map).bindPopup(getTitle(newArt));
    newArt.marker = marker;
    marker.on('click', () => showArtwork(newArt));
    alert(t('postedSuccessfully'));
  };
  reader.readAsDataURL(file);
});

updateTexts();

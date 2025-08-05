const artworks = [
  {
    title: "広島大学中央図書館",
    lat: 34.403244, 
    lng: 132.713469,
    image: "higashihiroshima.jpeg",
    description: "広島大学東広島キャンパスの中央図書館です。"
  }
];

const THRESHOLD_METERS = 100; // 100m以内で表示

const status = document.getElementById('status');
const artworkDiv = document.getElementById('artwork');
const artTitle = document.getElementById('art-title');
const artImage = document.getElementById('art-image');
const artDescription = document.getElementById('art-description');

let map;

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

if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    map = L.map('map').setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([latitude, longitude]).addTo(map).bindPopup('現在地').openPopup();
    artworks.forEach(a => {
      L.marker([a.lat, a.lng]).addTo(map).bindPopup(a.title);
    });
    const nearby = artworks.find(a => distanceMeters(latitude, longitude, a.lat, a.lng) < THRESHOLD_METERS);
    if (nearby) {
      status.textContent = "ようこそ！";
      artTitle.textContent = nearby.title;
      artImage.src = nearby.image;
      artDescription.textContent = nearby.description;
      artworkDiv.classList.remove('hidden');
    } else {
      status.textContent = "この場所では作品を閲覧できません。指定された地点に行ってください。";
    }
  }, showError);
} else {
  status.textContent = "このブラウザは位置情報に対応していません。";
}

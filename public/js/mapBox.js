export const displayMap = function (locations) {
  locations.reverse();
  var map = L.map('map', {
    center: locations[0].coordinates,
    zoom: 5, // Default zoom level for initial view
    minZoom: 3, // Prevent zooming out beyond zoom level 5
    maxZoom: 16, // Prevent zooming in beyond zoom level 10
    maxBounds: [
      [85, -180], // South-west corner (lat, lon)
      [-85, 180], // North-east corner (lat, lon)
    ],
  });
  // "https://{s}.tile.opentopomap.fr/hot/{z}/{x}/{y}.png"
  // 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  map.removeControl(map.zoomControl);
  const markers = [];

  locations.forEach(function (location) {
    var marker = L.marker(location.coordinates.reverse()).addTo(map);
    marker
      .bindPopup(
        `<p style="display : flex; justify-content:center; border-radius:0px; width:100%; height:100%; font-size:14px;">Day ${location.day} : ${location.description}</p>`,
        {
          maxWidth: 300, // Max width of the popup
          minWidth: 200, // Min width of the popup
          autoPan: true, // Make sure the map pans to fit the popup when it's opened, // Optional: Custom class for further styling (CSS)
        },
      )
      .openPopup();

    markers.push(marker);
  });

  // Calculate the bounds of the markers
  var bounds = L.latLngBounds(
    markers.map(function (marker) {
      return marker.getLatLng();
    }),
  );

  // Set the map view to center between the markers and adjust zoom level
  map.fitBounds(bounds, {
    maxZoom: 12, // Prevent zooming in too much
    minZoom: 5, // Prevent zooming out too much
  });
};

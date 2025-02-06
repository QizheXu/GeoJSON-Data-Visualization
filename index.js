mapboxgl.accessToken = 'pk.eyJ1IjoicWl6aGV4dSIsImEiOiJjbTZzbmE1bHcwOWFrMmtvc3M2bWVmd2d6In0.W9AIJnK5UM1GNNwKZIXU2g';

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10', // Optimized lightweight style
    zoom: 5,
    center: [-100, 40],
    renderWorldCopies: false, // Prevent unnecessary map duplication
    maxPitch: 60 // Limit tilt effect to improve rendering
});

// Remove tile prefetching (fixes excessive tile loading)
map.on('style.load', () => {
    map.prefetchTilesOnLoad = false;
});

// Store markers and popups globally
let markers = [];
let activePopup = null;

// Function to Generate Table and Enable Click Interaction
function generateTable(accommodations) {
    let table = document.querySelector("table");

    // Clear previous rows (except headers)
    table.innerHTML = `
        <tr>
            <th>Park Name</th>
            <th>Accommodation Name</th>
            <th>ID</th>
        </tr>
    `;

    accommodations.features.forEach((place, index) => {
        let row = table.insertRow(-1);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);

        let parkName = place.properties.ParkName || "Unknown";
        let accommodationName = place.properties.NAME || "Unknown";
        let objectID = place.properties.OBJECTID || "N/A";
        let coordinates = place.geometry.coordinates;

        cell1.innerHTML = parkName;
        cell2.innerHTML = accommodationName;
        cell3.innerHTML = objectID;

        row.setAttribute("data-coordinates", coordinates.join(","));

        // Click event to move the map & open the popup
        row.addEventListener("click", () => {
            openPopup(index, coordinates);
        });
    });
}

// Function to Open Popup and Close Previous One
function openPopup(index, coordinates) {
    if (activePopup) {
        activePopup.remove();
    }

    let selectedMarker = markers[index];
    let popup = selectedMarker.getPopup();
    popup.addTo(map);
    activePopup = popup;

    // Use `easeTo` instead of `flyTo` for a smoother transition
    map.easeTo({
        center: coordinates,
        zoom: 12,
        duration: 700 // Shorter duration for less delay
    });
}

// Function to Add Popups and Optimize Marker Rendering
function addPopups(accommodations) {
    // Enable clustering if too many points exist
    map.addSource('accommodations', {
        type: 'geojson',
        data: accommodations,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points
        clusterRadius: 50    // Cluster radius in pixels
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'accommodations',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': '#51bbd6',
            'circle-radius': 15
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'accommodations',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'accommodations',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': 'blue',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    accommodations.features.forEach((place, index) => {
        let parkName = place.properties.ParkName || "Unknown";
        let accommodationName = place.properties.NAME || "Unknown";
        let objectID = place.properties.OBJECTID || "N/A";
        let coordinates = place.geometry.coordinates;

        let popupContent = `
            <strong>${accommodationName}</strong><br>
            🏞 Park: ${parkName} <br>
            🔢 ID: ${objectID}
        `;

        let marker = new mapboxgl.Marker({ color: "blue" })
            .setLngLat(coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent))
            .addTo(map);

        markers.push(marker);
    });
}

// Sorting Function for Table
let ascendingOrder = true;

document.addEventListener("DOMContentLoaded", function () {
    let sortButton = document.getElementById("sortButton");

    if (sortButton) {
        sortButton.addEventListener('click', () => {
            sortTable();
        });
    }
});

function sortTable() {
    let table = document.querySelector("table");
    let rows = Array.from(table.rows).slice(1); // Skip header row

    if (rows.length === 0) {
        console.warn("No rows found to sort.");
        return;
    }

    rows.sort((rowA, rowB) => {
        let parkA = rowA.cells[0].innerText.toLowerCase();
        let parkB = rowB.cells[0].innerText.toLowerCase();
        return ascendingOrder ? parkA.localeCompare(parkB) : parkB.localeCompare(parkA);
    });

    // Reinsert sorted rows
    rows.forEach(row => table.appendChild(row));

    // Toggle sorting order for next click
    ascendingOrder = !ascendingOrder;
}

// Load Data and Apply Features
async function geojsonFetch() {
    try {
        let response, parks, accommodations;

        response = await fetch('assets/PARKS_-_Park_Boundaries.geojson');
        if (!response.ok) throw new Error("Failed to load PARKS_-_Park_Boundaries.geojson");
        parks = await response.json();

        response = await fetch('assets/Park_Accommodations_8238258718268374581.geojson');
        if (!response.ok) throw new Error("Failed to load Park_Accommodations.geojson");
        accommodations = await response.json();

        map.on('load', function () {
            map.addSource('parks', { type: 'geojson', data: parks });
            map.addLayer({
                'id': 'parks-layer',
                'type': 'fill',
                'source': 'parks',
                'paint': {
                    'fill-color': '#6DA34D',
                    'fill-opacity': 0.5
                }
            });

            generateTable(accommodations);
            addPopups(accommodations);
        });
    } catch (error) {
        console.error("Error loading GeoJSON:", error);
    }
}

// Run the Function
geojsonFetch();
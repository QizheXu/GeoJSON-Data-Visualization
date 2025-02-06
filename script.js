// JavaScript file for the map 
console.log("Script is running!"); // Debugging check
// Step 1: Add Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoicWl6aGV4dSIsImEiOiJjbTZzbmE1bHcwOWFrMmtvc3M2bWVmd2d6In0.W9AIJnK5UM1GNNwKZIXU2g';

// Step 2: Create a new map instance
let map = new mapboxgl.Map({
    container: 'map', // The ID of the div where the map will be displayed
    style: 'mapbox://styles/mapbox/satellite-v9', // Map style
    zoom: 5.5, // Default zoom level
    center: [138, 38] // Centered over Japan
});

// Step 3: Load GeoJSON Data Asynchronously
async function geojsonFetch() {
    let response, earthquakes, japan;

    // Fetch Earthquake Data
    response = await fetch('assets/earthquakes.geojson');
    earthquakes = await response.json();

    // Fetch Japan County Data
    response = await fetch('assets/japan.json');
    japan = await response.json();

    // Add Data to Map
    map.on('load', function loadingData() {
        // Add Earthquake Data as a Layer
        map.addSource('earthquakes', {
            type: 'geojson',
            data: earthquakes
        });

        map.addLayer({
            'id': 'earthquakes-layer',
            'type': 'circle',
            'source': 'earthquakes',
            'paint': {
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-color': 'red',
                'circle-stroke-color': 'white'
            }
        });

        // Add Japan County Data as a Layer
        map.addSource('japan', {
            type: 'geojson',
            data: japan
        });

        map.addLayer({
            'id': 'japan-layer',
            'type': 'fill',
            'source': 'japan',
            'paint': {
                'fill-color': '#0080ff',
                'fill-opacity': 0.5
            }
        });

        // Call generateTable function to display earthquakes in the table
        generateTable(earthquakes);
    });
}

// Call the function to load data
geojsonFetch();

// Populate the Table with Earthquake Data
function generateTable(earthquakes) {
    let table = document.querySelector("table");

    // Loop through each earthquake feature in the GeoJSON data
    earthquakes.features.forEach((quake) => {
        let row = table.insertRow(-1);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);

        // Populate table with earthquake properties
        cell1.innerHTML = quake.properties.id;
        cell2.innerHTML = quake.properties.mag;
        cell3.innerHTML = new Date(quake.properties.time).toLocaleString("en-US");
    });
}

document.getElementById("sortButton").addEventListener('click', sortTable);

function sortTable() {
    let table = document.querySelector("table");
    let rows = Array.from(table.rows).slice(1); // Convert HTMLCollection to an array

    // Sort using array's built-in sort function (faster than manually swapping rows)
    rows.sort((rowA, rowB) => {
        let x = parseFloat(rowA.cells[1].innerText); // Magnitude column
        let y = parseFloat(rowB.cells[1].innerText);
        return y - x; // Descending order
    });

    // Reinsert sorted rows into the table
    rows.forEach(row => table.appendChild(row));
}
import { upload,download } from "./cache.js";

export const getCoordinates = (luogo) => {
    console.log(luogo);
    return new Promise((resolve) => {
        fetch("conf.json").then(r => r.json()).then(confData => {
            fetch(confData.geoUrl.replace("$LUOGO", luogo[0])).then(r => r.json()).then(data => {
                let object = { name: luogo[0], coords: [data[0].lat, data[0].lon] };
                console.log(object);
                resolve(object);
            })
        })
    })
};

export function carica_marker(map) {
    download().then((places) => {
        places = places || []; // Inizializza un array vuoto se non ci sono luoghi salvati
        console.log("Luoghi salvati:", places);

        // Aggiungi un marker per ogni luogo
        places.forEach((place) => {
            if (Array.isArray(place.coords) && place.coords.length === 2) {
                const [lat, lng] = place.coords;

                // Aggiungi il marker solo se le coordinate sono valide
                if (!isNaN(lat) && !isNaN(lng)) {
                    const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
                    marker.bindPopup(`
                        <b>${place.name}</b><br>
                        ${place.description || "Nessuna descrizione disponibile."}
                    `);
                } else {
                    console.error(`Coordinate non numeriche per il luogo: ${JSON.stringify(place)}`);
                }
            } else {
                console.error(`Coordinate non valide per il luogo: ${JSON.stringify(place)}`);
            }
        });
    }).catch((error) => {
        console.error("Errore durante il download dei luoghi:", error);
    });
}
export function addCustomMarker(map, newPlace, newCoords) {
    if (Array.isArray(newCoords) && newCoords.length === 2) {
      const [lat, lng] = newCoords;
  
      // Aggiungi il marker solo se le coordinate sono valide
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
        marker.bindPopup(`
          <b>${newPlace.name}</b><br>
          ${newPlace.description || "Nessuna descrizione disponibile."}
        `);
      } else {
        console.error(`Coordinate non numeriche per il luogo: ${JSON.stringify(newPlace)}`);
      }
    } else {
      console.error(`Coordinate non valide per il luogo: ${JSON.stringify(newPlace)}`);
    }
  }
  



export const handleNavigation = () => {
    let hash = window.location.hash || "#homepage";
    document.querySelectorAll(".page").forEach(page => page.style.display = "none");

    if (hash.startsWith("#dettaglio_")) {
        let id = hash.replace("#dettaglio_", "");
        console.log("Detail ID:", id); // Debug ID
        showDetail(id);
        document.getElementById("dettaglio").style.display = "block";
    } else {
        document.querySelector(hash).style.display = "block";
    }
};

export const showDetail = (id) => {
    console.log("ID ricevuto:", id); 
    // Recupera la lista dei luoghi dal localStorage (se già salvati)
    const places = JSON.parse(localStorage.getItem('places')) || [];
    console.log("Luoghi salvati:", places);  // Log dei luoghi per il debug

    // Trova il luogo che corrisponde all'ID
    const place = places.find(p => p.id === id);
    console.log("Luogo trovato:", place);
    if (place) {
        document.getElementById('detailName').innerText = place.name;
        document.getElementById('detailDescription').innerText = place.description;
    } else {
        document.getElementById('detailName').innerText = 'Luogo non trovato';
        document.getElementById('detailDescription').innerText = 'Impossibile trovare i dettagli per questo luogo.';
    }
};

export function login_fetch(username, password) {
    return new Promise((resolve, reject) => {
        // Leggi il token dal file conf.json
        fetch("conf.json")
            .then(r => r.json())
            .then(confData => {
                if (!confData.token) {
                    throw new Error("Token non trovato in conf.json");
                }

                // Esegui la richiesta di login usando il token
                return fetch("http://ws.cipiaceinfo.it/credential/login", { 
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "key": confData.token // Usa il token letto da conf.json
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
            })
            .then(r => r.json())
            .then(r => resolve(r.result)) // Restituisci il risultato della richiesta
            .catch(reject); // Gestisci eventuali errori
    });
}
// Funzione per aggiungere il nuovo luogo alla tabella
export const addNewPlaceToTable = (place) => {
    console.log("Aggiungendo luogo alla tabella:", place);    
    const container = document.getElementById('tableAdmin').querySelector('tbody');
    container.innerHTML += `
        <tr>
            <td>${place.id}</td>
            <td><a href="#dettaglio_${place.id}" class="detail-link">${place.name}</a></td>
            <td>${place.description}</td>
            <td><img class="imgAdmin" src="${place.img}" alt="${place.name}" /></td>
            <td class="azioni">
                <button style="display:block;" onclick="editPlace('${place.id}')">Modifica</button>
                <button style="display:block;" onclick="deletePlace('${place.id}')">Elimina</button>
            </td>
        </tr>
    `;
};

// Funzione per aggiungere il nuovo luogo alla tabella della homepage
export const addNewPlaceToHomepageTable = (place) => {
    const container = document.getElementById('table');
    container.innerHTML += `
        <tr>
                <td>${place.id}</td>
                <td><a href="#dettaglio_${place.id}" class="detail-link">${place.name}</a></td>
        </tr>
    `;
};


// Funzione per aggiungere il nuovo luogo alla mappa
export const addNewPlaceToMap = (place) => {
    const marker = L.marker([place.coords[0], place.coords[1]]).addTo(map);
    marker.bindPopup(`
        <b>${place.name}</b><br>${place.description}
    `);
};



// Funzione per creare e salvare un luogo con un ID unico persistente
export const createPlace = (name, description, coords, img) => {
    // Recupera i luoghi dalla cache (usando la funzione download)
    download().then((places) => {
        places = places || [];

        // Verifica se il luogo esiste già, altrimenti crea un nuovo luogo
        const existingPlace = places.find(place => place.name === name);
        
        let place;
        
        if (existingPlace) {
            // Usa l'ID esistente se il luogo esiste già
            place = { 
                ...existingPlace, 
                name, 
                description, 
                coords, 
                img 
            };
        } else {
            // Crea un nuovo luogo con ID unico solo la prima volta
            place = { 
                id: uuid.v4(), // Genera un ID unico solo quando il luogo è nuovo
                name, 
                description, 
                coords, 
                img 
            };
            
            // Aggiungi il nuovo luogo all'array dei luoghi
            places.push(place);
        }

        // Salva i luoghi nella cache (usando la funzione upload)
        upload(places).then(() => {
            console.log("Luogo salvato nella cache");

            // Aggiungi il nuovo luogo alla tabella, mappa e homepage
            addNewPlaceToTable(place);
            addNewPlaceToMap(place);
            addNewPlaceToHomepageTable(place);  // Aggiungi il luogo anche nella tabella della homepage
        }).catch(error => {
            console.error("Errore durante il salvataggio nella cache:", error);
        });
    }).catch(error => {
        console.error("Errore durante il recupero dei luoghi dalla cache:", error);
    });
};

//funzione per la login
export function loadConfig() {
    return fetch('conf.json')
      .then(response => response.json())
      .then(config => config.tokenMap) // Restituisce il tokenMap
      .catch(error => {
        console.error("Errore nel caricamento del file di configurazione:", error);
        throw error;  // Propaga l'errore per gestirlo in seguito
      });
  }

// Elimina un punto di interesse
// functions.js
export function deletePlace(placeId) {
    download().then((places) => {
      places = places || [];
  
      const placeIndex = places.findIndex(place => place.id === placeId);
      if (placeIndex !== -1) {
        const deletedPlace = places.splice(placeIndex, 1)[0];
        //removePlaceFromMap(deletedPlace.id);
        removePlaceFromTable(deletedPlace.id);
        removeTableHomepage(deletedPlace.id);
  
        upload(places).then(() => {
          console.log('Luogo eliminato con successo');
        }).catch((error) => {
          console.error('Errore durante l\'upload dei luoghi aggiornati:', error);
        });
      }
    }).catch((error) => {
      console.error('Errore durante il download dei luoghi:', error);
    });
  }
  
  // Lega la funzione a window per renderla globale
  window.deletePlace = deletePlace;
  



 export const updatePlaceInTable = (updatedPlace) => {
    const rows = document.querySelectorAll('#tableAdmin tbody tr');
    rows.forEach(row => {
        const idCell = row.cells[0].textContent;
        if (idCell === updatedPlace.id) {
            row.cells[1].innerHTML = `<a href="#dettaglio_${updatedPlace.id}" class="detail-link">${updatedPlace.name}</a>`;
            row.cells[2].textContent = updatedPlace.description;
            row.cells[3].innerHTML = `<img class="imgAdmin" src="${updatedPlace.img}" alt="${updatedPlace.name}" />`;
        }
    });
};


export const removePlaceFromTable = (placeId) => {
    const rows = document.querySelectorAll('#tableAdmin tbody tr');
    rows.forEach(row => {
        const idCell = row.cells[0].textContent;
        if (idCell === placeId) {
            row.remove();
        }
    });
};
export const removeTableHomepage = (placeId) =>{
    const rows = document.querySelectorAll('#table tbody tr');
    rows.forEach(row => {
        const idCell = row.cells[0].textContent;
        if (idCell === placeId) {
            row.remove();
        }
    });
}

export const updatePlaceInMap = (updatedPlace) => {
    // Rimuovi il marker esistente
    window.map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.getPopup().getContent().includes(updatedPlace.name)) {
            window.map.removeLayer(layer);
        }
    });

    // Aggiungi il nuovo marker
    const marker = L.marker([updatedPlace.coords[0], updatedPlace.coords[1]]).addTo(window.map);
    marker.bindPopup(`
        <b>${updatedPlace.name}</b><br>${updatedPlace.description}
    `);
};

export const removePlaceFromMap = (placeId) => {
    // Rimuovi il marker corrispondente
    window.map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.getPopup().getContent().includes(placeId)) {
            window.map.removeLayer(layer);
        }
    });
};





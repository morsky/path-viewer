'use strict';

/////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  #map;
  #awoledFileFormats = ['kml'];
  #fillPath = document.getElementById('fill-path');
  #inputFile = document.getElementById('fileinput');
  #resetPage = document.getElementById('reset-page');
  #errorPopUp = document.getElementById('error');
  #errorMessage = document.getElementById('error-text');
  #pathOptions = document.getElementById('path-options');
  #coordinates = [];

  constructor() {
    // Load map
    this._loadMap();
    this.#errorPopUp.style.display = 'none';
    this.#pathOptions.style.visibility = 'hidden';

    // Attach event handlers
    this.#inputFile.addEventListener(
      'change',
      async ev => {
        try {
          this._clearError();
          this.#coordinates = [];
          this.#pathOptions.style.visibility = 'visible';
          this.#fillPath.checked = false;

          // Handle multiple fileuploads
          let files = ev.currentTarget.files;
          let readers = [];

          // Abort if there were no files selected
          if (!files.length) return;

          this._checkFiles(files, readers);

          const data = await Promise.all(readers);

          this._processData(data);
        } catch (err) {
          this.#errorPopUp.style.display = 'flex';
          this.#errorMessage.innerHTML = err.message;
        }
      },
      false
    );

    this._resetPage();
    this._fillPath();
  }

  _resetPage() {
    this.#resetPage.addEventListener(
      'click',
      () => {
        this.#map.remove();
        this.#inputFile.value = '';
        if (this.#fillPath.checked) this.#fillPath.checked = false;
        this._loadMap();
        this._clearError();
        this.#pathOptions.style.visibility = 'hidden';
      },
      false
    );
  }

  _loadMap() {
    this.#map = L.map('map').setView([10, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
  }

  _checkFiles(files, readers) {
    for (let i = 0; i < files.length; i++) {
      const fileExtension = files[i].name.slice(-3);

      if (!this.#awoledFileFormats.includes(fileExtension))
        throw new Error(`File: ${files[i].name} is not a valid file!!!`);

      // Store promises in array
      readers.push(this._readFileAsText(files[i]));
    }
  }

  /**
   *  Simple JavaScript Promise that reads a file as text.
   **/
  _readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      let fr = new FileReader();

      fr.onload = function () {
        resolve(fr.result);
      };

      fr.onerror = function () {
        reject(fr);
      };

      fr.readAsText(file);
    });
  }

  _processData(data) {
    data.forEach(el => {
      const coords = el
        .split('\n')
        .filter(el => el.includes('<gx:coord>'))
        .map(el => {
          const allCoords = el.split(/<[^>]*>/);
          const coords = allCoords[1].split(' ');
          const lat = coords[1];
          const lng = coords[0];
          const arr = [Number(lat), Number(lng)];

          this.#coordinates.push(arr);
        });

      if (this.#coordinates.length === 0)
        throw new Error(`No coordinates found!`);

      this._renderPath(this.#coordinates);
    });
  }

  _renderPath(pathArray, filled) {
    if (!filled) {
      this.#map.remove();
      this._loadMap();
    }

    // create a red polyline from an array of LatLng points
    const polyline = L.polyline(pathArray, {
      color: 'red',
      smoothFactor: 6,
      fill: filled,
    }).addTo(this.#map);

    // zoom the map to the polyline
    this.#map.fitBounds(polyline.getBounds());
  }

  _clearError() {
    this.#errorPopUp.style.display = 'none';
    this.#errorMessage.innerHTML = '';
  }

  _fillPath() {
    this.#fillPath.addEventListener(
      'click',
      () => {
        this._renderPath(this.#coordinates, this.#fillPath.checked);
      },
      false
    );
  }
}

const app = new App();

let myTable;
let minLength = 999999, maxLength = 0;
let minArea = 99999999, maxArea = 0;

let continenti = ["North America", "South America", "Africa", "Europe", "Asia", "Oceania"];
let etichette = ["NORTH AMERICA", "SOUTH AMERICA", "AFRICA", "EUROPE", "ASIA", "OCEANIA"];

let fiumi = [];

//struttura canvas e caricamento dei dati
function setup() {
  createCanvas(windowWidth, windowHeight);
  loadAndProcessData();
}
async function loadAndProcessData() {
  myTable = await loadTable("assets/rivers.csv", ",", "header");

  if (myTable) {
    minLength = 999999; maxLength = 0;
    minArea = 99999999; maxArea = 0;

    // calcolo x valori minimi e massimi per la mappatura
    for (let i = 0; i < myTable.getRowCount(); i++) {
      let lunghezza = myTable.getNum(i, "length");
      let area = myTable.getNum(i, "area");
      
      if (!isNaN(lunghezza)) {
        if (lunghezza > maxLength) maxLength = lunghezza;
        if (lunghezza < minLength && lunghezza > 0) minLength = lunghezza;
      }
      if (!isNaN(area)) {
        if (area > maxArea) maxArea = area;
        if (area < minArea && area > 0) minArea = area;
      }
    }

    fiumi = [];

    //array strutturato per continente
    for (let k = 0; k < continenti.length; k++) {
      for (let i = 0; i < myTable.getRowCount(); i++) {
        let c = myTable.getString(i, "continent");
        if (c === "Australia") c = "Oceania"; 
        
        if (c === continenti[k]) {
          let nome = myTable.getString(i, "name");
          let len = myTable.getNum(i, "length");
          let area = myTable.getNum(i, "area");
          let temp = myTable.getNum(i, "avg_temp");
          
          if (len > 0) {
            fiumi.push({
              nome: nome,
              continente: c,
              idContinente: k,
              lunghezza: len,
              area: area,
              temp: temp,
              d: map(len, 0, maxLength, 10, 80),
              sw: map(area, 0, maxArea, 1.2, 9),
              x: 0, y: 0, targetX: 0, targetY: 0 
            });
          }
        }
      }
    }

    let startX = width * 0.12;
    let endX = width - (width * 0.12);
    let stepX = (endX - startX) / fiumi.length;
    let centerY = height / 2 + 40; 

    for (let i = 0; i < fiumi.length; i++) {
      fiumi[i].targetX = startX + (i * stepX);
      let phase = map(fiumi[i].targetX, startX, endX, 0, TWO_PI);
      fiumi[i].targetY = centerY + sin(phase) * (height / 6.0);
      
      fiumi[i].x = fiumi[i].targetX;
      fiumi[i].y = fiumi[i].targetY;
    }

    // algoritmo x evitare sovrapposizioni
    for (let iter = 0; iter < 300; iter++) {
      for (let i = 0; i < fiumi.length; i++) {
        let f1 = fiumi[i];
        for (let j = i + 1; j < fiumi.length; j++) {
          let f2 = fiumi[j];
          let dx = f2.x - f1.x;
          let dy = f2.y - f1.y;
          let distanza = sqrt(dx * dx + dy * dy);
          
          let distanzaMinima = (f1.d / 2) + (f2.d / 2) + (f1.sw / 2) + (f2.sw / 2) + 6;
          
          if (distanza < distanzaMinima && distanza > 0) {
            let sovrapposizione = distanzaMinima - distanza;
            let nx = dx / distanza;
            let ny = dy / distanza;
            
            f1.x -= nx * sovrapposizione * 0.5;
            f1.y -= ny * sovrapposizione * 0.5;
            f2.x += nx * sovrapposizione * 0.5;
            f2.y += ny * sovrapposizione * 0.5;
          }
        }
        f1.y = lerp(f1.y, f1.targetY, 0.04);
      }
    }
  }
}

// struttura grafica principale
function draw() {
  background(255);

  if (fiumi.length === 0) {
    fill(20);
    noStroke();
    textSize(16);
    text("Caricamento dataset in corso...", 40, 40);
    return; 
  }

  // titolo
  fill(20);
  noStroke();
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(38);
  text("WORLD RIVERS", 40, 20);

  // sottotitolo
  textStyle(NORMAL);
  textSize(14);
  fill(60);
  text("Visualizzazione metrica dei fiumi strutturata per flusso continentale.", 40, 65);
  
  // legenda
  let legendY = 95;
  textSize(15);
  textStyle(BOLD);
  fill(20);
  text("LEGENDA E METRICHE:", 40, legendY);
  
  textStyle(NORMAL);
  textSize(14); 
  fill(50);
  text("• Lunghezza: diametro del glifo (" + minLength + " km - " + maxLength + " km)", 40, legendY + 24);
  text("• Area del bacino: spessore del tratto del glifo", 40, legendY + 46);
  text("• Dettagli: consultabili tramite passaggio del cursore (rollover).", 40, legendY + 68);

  let toolX = 0, toolY = 0;
  let tooltipDati = [];
  let fiumeSelezionato = null;

  // ciclo di scansione e disegno dei glifi
  for (let i = 0; i < fiumi.length; i++) {
    let f = fiumi[i];
    let col = getContinentColor(f.continente);
    
    let distanzaMouse = dist(mouseX, mouseY, f.x, f.y);
    let sopra = (distanzaMouse < f.d / 2);

    if (sopra) {
      fiumeSelezionato = f; 
    }

    // Chiamata alla funzione personalizzata per il glifo
    disegnaGlifo(f.x, f.y, f.d, f.sw, col);
  }

  // Gestione rollover sul glifo 
  if (fiumeSelezionato != null) {
    let f = fiumeSelezionato;
    let col = getContinentColor(f.continente);

    push();
    translate(f.x, f.y);
    noStroke();
    fill(red(col), green(col), blue(col), 40);
    ellipse(0, 0, f.d + 12, f.d + 12);
    pop();

    disegnaGlifo(f.x, f.y, f.d, f.sw, col);

    tooltipDati = [
      f.nome.toUpperCase(),
      (isNaN(f.temp) ? "Temperatura: N/D" : "Temperatura: " + f.temp + " °C")
    ];
    toolX = mouseX;
    toolY = mouseY;
  }

  // etichette dei continenti
  for (let k = 0; k < continenti.length; k++) {
    let sumX = 0;
    let minY = 999999;
    let maxY = -999999;
    let count = 0;
    
    for (let i = 0; i < fiumi.length; i++) {
      if (fiumi[i].idContinente === k) {
        sumX += fiumi[i].x;
        if (fiumi[i].y < minY) minY = fiumi[i].y;
        if (fiumi[i].y > maxY) maxY = fiumi[i].y;
        count++;
      }
    }
    
    if (count > 0) {
      let avgX = sumX / count;
      fill(getContinentColor(continenti[k]));
      noStroke();
      textStyle(BOLD);
      textSize(13);

      let offsetVerticale = max(30, height * 0.05);

      if (k === 2) {
        textAlign(CENTER, TOP);
        text(etichette[k], avgX, maxY + offsetVerticale);
      } else if (k === 3) {
        // Europa sotto ai suoi fiumi ma spostata a destra
        textAlign(LEFT, TOP);
        text(etichette[k], avgX + 10, maxY + offsetVerticale);
      } else if (k === 5) {
        textAlign(CENTER, TOP);
        text(etichette[k], avgX, maxY + offsetVerticale);
      } else {
        textAlign(CENTER, BOTTOM);
        text(etichette[k], avgX, minY - 60);
      }
    }
  }

  // pannello informativo a comparsa
  if (tooltipDati.length > 0) {
    textStyle(NORMAL);
    textSize(12);
    
    let w = max(textWidth(tooltipDati[0]), textWidth(tooltipDati[1])); 
    
    fill(255, 245);
    stroke(150);
    strokeWeight(1);
    
    let tooltipX = toolX + 15;
    if (tooltipX + w > width) { tooltipX = toolX - w - 25; }

    rect(tooltipX, toolY - 10, w + 24, 48, 4);
    
    fill(20);
    noStroke();
    textAlign(LEFT, TOP);
    
    textStyle(BOLD);
    text(tooltipDati[0], tooltipX + 12, toolY - 2); 
    textStyle(NORMAL);
    text(tooltipDati[1], tooltipX + 12, toolY + 16);
  }
}

// funzione per generare il glifo modulare del data point
function disegnaGlifo(x, y, size, sw, col) {
  push();
  translate(x, y);
  rectMode(CENTER);
  
  noFill();
  stroke(col);
  strokeWeight(sw);
  
  //geometria principale (cerchio modulare)
  ellipse(0, 0, size, size);
  
  pop();
}

// palette cromatica per i continenti
function getContinentColor(continente) {
  if (continente === "North America") return color(0, 112, 255);      
  else if (continente === "South America") return color(64, 224, 208);  
  else if (continente === "Africa") return color(114, 9, 183);          
  else if (continente === "Europe") return color(72, 202, 228);         
  else if (continente === "Asia") return color(0, 119, 182);            
  else if (continente === "Oceania") return color(0, 75, 85);           
  else return color(100, 100, 100);
}

// adattamento responsivo 
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  loadAndProcessData();
}
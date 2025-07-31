// Calculator - Grade Calculator for Esprit Students
// Developed by Nasri Ayari
class EspritGradeCalculator {
  constructor() {
    this.currentData = [];
    this.groupedData = {};
    this.isCalculated = false;
    this.originalTable = null;
    
    // UE Groups with proper module mapping and credits
    this.ueGroups = {
      "Algorithmique et résolution de problèmes": {
        modules: [
          { name: "Algorithmique et structure de données", credits: 3 },
          { name: "Analyse numérique", credits: 2 }
        ],
        totalCredits: 5
      },
      "Modélisation et Programmation par Objet": {
        modules: [
          { name: "Conception par Objet et Programmation Java", credits: 4 },
          { name: "Outil collaboratif GIT", credits: 1 },
          { name: "Langage de modélisation (UML)", credits: 3 }
        ],
        totalCredits: 8
      },
      "Communication, Culture et Citoyenneté F1_Professionnel": {
        modules: [
          { name: "Communication, Culture et Citoyenneté F1_PR", credits: 2 }
        ],
        totalCredits: 2
      },
      "Communication, Culture et Citoyenneté A1_Professionnel": {
        modules: [
          { name: "Communication, Culture et Citoyenneté A1_PR", credits: 2 }
        ],
        totalCredits: 2
      },
      "Développement Web": {
        modules: [
          { name: "Technologies Web 2.0", credits: 3 },
          { name: "Application coté client Angular-1", credits: 2 },
          { name: "Java scripts coté serveur", credits: 2 }
        ],
        totalCredits: 7
      },
      "Fondements des TIC": {
        modules: [
          { name: "Bases de Données", credits: 2 },
          { name: "Sys. De Gestion de Bases de Données", credits: 3, aliases: ["SGBD", "Système de Gestion de Bases de Données", "Gestion de Bases de Données"] }
        ],
        totalCredits: 5
      },
      "Fondements système et réseaux": {
        modules: [
          { name: "Système et scripting", credits: 2 },
          { name: "Fondements des Réseaux", credits: 3 }
        ],
        totalCredits: 5
      },
      "Projet d'intégration": {
        modules: [
          { name: "Projet d'Intégration Java/Mobile", credits: 6 }
        ],
        totalCredits: 6
      }
    };

    // Default note coefficients for different evaluation types
    this.defaultNoteCoefs = {
      exam_only: { exam: 1.0 },
      exam_cc: { exam: 0.8, cc: 0.2 },
      exam_tp: { exam: 0.8, tp: 0.2 },
      exam_cc_tp: { exam: 0.5, cc: 0.2, tp: 0.3 }
    };

    this.init();
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case "calculateGrades":
          this.calculateGrades();
          break;
        case "getGradeStatus":
          sendResponse({ status: this.isCalculated ? "calculated" : "not_calculated" });
          break;
        case "exportGrades":
          this.exportGrades();
          break;
      }
    });
  }

  // Main calculation function
  calculateGrades() {
    try {
      const table = document.getElementById("ContentPlaceHolder1_GridView1");
      if (!table) {
        this.showNotification("Table des notes non trouvée sur cette page", "error");
        return;
      }

      this.originalTable = table;
      this.currentData = this.parseTable(table);
      
      // Check for rattrapage grades in GridView2
      this.handleRattrapageGrades();
      
      if (this.currentData.length === 0) {
        this.showNotification("Aucune donnée de note trouvée", "warning");
        return;
      }

      // Calculate individual averages
      this.calculateIndividualAverages();
      
      // Group modules by UE and calculate group averages
      this.groupModulesByUE();
      
      // Create enhanced tables
      this.createEnhancedTables();
      
      this.isCalculated = true;
      this.showNotification("Calculs terminés avec succès! - Calculator by Nasri Ayari", "success");
      
    } catch (error) {
      console.error("Error calculating grades:", error);
      this.showNotification("Erreur lors du calcul des notes: " + error.message, "error");
    }
  }

  // Parse the original table into structured data
  parseTable(table) {
    const data = [];
    const rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName("td");
      if (cells.length < 5) continue;

      const designation = cells[0]?.textContent.trim();
      const enseignant = cells[1]?.textContent.trim();
      
      // Parse grades with European decimal format support
      const noteCC = this.parseGrade(cells[2]?.textContent.trim());
      const noteTP = this.parseGrade(cells[3]?.textContent.trim());
      const noteExam = this.parseGrade(cells[4]?.textContent.trim());

      // Get module credits
      const credits = this.getModuleCredits(designation);

      data.push({
        designation,
        enseignant,
        noteCC,
        noteTP,
        noteExam,
        noteRattrapage: null, // Will be populated from GridView2 if exists
        credits,
        moyenne: 0 // Will be calculated
      });
    }

    return data;
  }

  // Handle rattrapage grades from GridView2
  handleRattrapageGrades() {
    const rattrapageTable = document.getElementById("ContentPlaceHolder1_GridView2");
    if (!rattrapageTable) {
      console.log("No rattrapage table found (GridView2)");
      return;
    }

    console.log("Found rattrapage table, processing...");
    console.log("Rattrapage table structure:", rattrapageTable.outerHTML.substring(0, 500));
    
    const rows = rattrapageTable.getElementsByTagName("tr");
    console.log(`Found ${rows.length} rows in rattrapage table`);

    // Check header row to understand table structure
    if (rows.length > 0) {
      const headerCells = rows[0].getElementsByTagName("th");
      console.log("Header columns:", Array.from(headerCells).map(cell => cell.textContent.trim()));
    }

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName("td");
      console.log(`Row ${i} has ${cells.length} cells:`, Array.from(cells).map(cell => cell.textContent.trim()));
      
      if (cells.length < 2) continue;

      const rattrapageDesignation = cells[0]?.textContent.trim();
      
      // Try different column positions for rattrapage grade
      let rattrapageGrade = null;
      for (let colIndex = 1; colIndex < cells.length; colIndex++) {
        const cellText = cells[colIndex]?.textContent.trim();
        const grade = this.parseGrade(cellText);
        if (grade !== null && grade >= 0 && grade <= 20) {
          rattrapageGrade = grade;
          console.log(`Found rattrapage grade ${rattrapageGrade} in column ${colIndex} for ${rattrapageDesignation}`);
          break;
        }
      }

      if (rattrapageGrade !== null && rattrapageDesignation) {
        // Find corresponding module in currentData and replace exam grade with rattrapage
        let moduleIndex = -1;
        
        // First try exact match
        moduleIndex = this.currentData.findIndex(module => 
          module.designation.toLowerCase() === rattrapageDesignation.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (moduleIndex === -1) {
          moduleIndex = this.currentData.findIndex(module => 
            this.isModuleMatch(module.designation.toLowerCase(), rattrapageDesignation.toLowerCase())
          );
        }

        if (moduleIndex !== -1) {
          console.log(`Replacing exam grade for "${this.currentData[moduleIndex].designation}" with rattrapage: ${rattrapageGrade}`);
          this.currentData[moduleIndex].noteExam = rattrapageGrade;
          this.currentData[moduleIndex].noteRattrapage = rattrapageGrade;
          this.currentData[moduleIndex].hasRattrapage = true;
          
          // Show notification for rattrapage replacement
          this.showNotification(`Note de rattrapage appliquée: ${this.currentData[moduleIndex].designation} (${rattrapageGrade})`, "info");
        } else {
          console.log(`No matching module found for rattrapage: "${rattrapageDesignation}"`);
          console.log("Available modules:", this.currentData.map(m => m.designation));
        }
      }
    }
  }

  // Parse grade with European decimal format support
  parseGrade(gradeText) {
    if (!gradeText || gradeText === "") return null;
    const cleaned = gradeText.replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  // Get module credits based on UE grouping
  getModuleCredits(moduleName) {
    // Normalize spaces and trim
    const normalizedModuleName = moduleName.replace(/\s+/g, ' ').trim();
    const lowerName = normalizedModuleName.toLowerCase();
    
    // Special case: If module name contains "gestion", it's SGBD (3 credits)
    if (lowerName.includes("gestion")) {
      console.log(`Found "Gestion" keyword: ${normalizedModuleName} -> SGBD (3 credits)`);
      return 3;
    }
    
    // First pass: Check for exact name matches
    for (const ueGroup of Object.values(this.ueGroups)) {
      for (const module of ueGroup.modules) {
        if (lowerName === module.name.toLowerCase()) {
          console.log(`Found exact match: ${normalizedModuleName} -> ${module.name} (${module.credits} credits)`);
          return module.credits;
        }
      }
    }
    
    // Second pass: Check for alias matches
    for (const ueGroup of Object.values(this.ueGroups)) {
      for (const module of ueGroup.modules) {
        if (module.aliases) {
          for (const alias of module.aliases) {
            if (lowerName === alias.toLowerCase() || 
                lowerName.includes(alias.toLowerCase()) || 
                alias.toLowerCase().includes(lowerName)) {
              console.log(`Found alias match: ${normalizedModuleName} -> ${module.name} (${module.credits} credits)`);
              return module.credits;
            }
          }
        }
      }
    }
    
    // Third pass: Check for partial matches (but exclude modules with aliases to prevent conflicts)
    for (const ueGroup of Object.values(this.ueGroups)) {
      for (const module of ueGroup.modules) {
        if (!module.aliases && (lowerName.includes(module.name.toLowerCase()) || module.name.toLowerCase().includes(lowerName))) {
          console.log(`Found partial match: ${normalizedModuleName} -> ${module.name} (${module.credits} credits)`);
          return module.credits;
        }
      }
    }
    
    // Additional debug: log communication module names checked in isModuleMatch
    if (lowerName.includes("communication")) {
      console.log(`Communication module not matched: ${normalizedModuleName}`);
    }
    
    console.log(`No match found for module: ${normalizedModuleName}, using default 1 credit`);
    return 1; // Default credit value
  }

  // Check if module names match (with partial matching and aliases)
  isModuleMatch(name1, name2, aliases = []) {
    // Special handling for Communication modules to prevent cross-matching
    if (name1.includes("communication") && name2.includes("communication")) {
      // Check for exact F1 vs A1 distinction
      const name1HasF1 = name1.includes("f1");
      const name1HasA1 = name1.includes("a1");
      const name2HasF1 = name2.includes("f1");
      const name2HasA1 = name2.includes("a1");
      
      if ((name1HasF1 && name2HasA1) || (name1HasA1 && name2HasF1)) {
        return false; // Don't match F1 with A1
      }
      
      // Only match if both have the same language designation
      if ((name1HasF1 && name2HasF1) || (name1HasA1 && name2HasA1)) {
        return true;
      }
      
      return false; // No match for communication modules without clear F1/A1
    }
    
    // Check direct match
    if (name1.includes(name2) || name2.includes(name1)) {
      return true;
    }
    
    // Check aliases
    for (const alias of aliases) {
      if (name1.includes(alias.toLowerCase()) || alias.toLowerCase().includes(name1)) {
        return true;
      }
    }
    
    // Check similarity
    return this.calculateSimilarity(name1, name2) > 0.7;
  }

  // Calculate string similarity for better module matching
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance for string similarity
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Calculate individual module averages
  calculateIndividualAverages() {
    let totalWeightedScore = 0;
    let totalCredits = 0;

    this.currentData.forEach(module => {
      module.moyenne = this.calculateModuleAverage(module);
      
      if (module.moyenne !== null) {
        totalWeightedScore += module.moyenne * module.credits;
        totalCredits += module.credits;
      }
    });

    // Add general average
    const generalAverage = totalCredits > 0 ? totalWeightedScore / totalCredits : 0;
    this.currentData.push({
      designation: "Moyenne Générale Individuelle",
      enseignant: "",
      noteCC: null,
      noteTP: null,
      noteExam: null,
      credits: totalCredits,
      moyenne: generalAverage,
      isGeneral: true
    });
  }

  // Calculate average for a single module
  calculateModuleAverage(module) {
    const { noteCC, noteTP, noteExam } = module;
    
    // Determine evaluation type and calculate accordingly
    if (noteExam === null) return null;
    
    if (noteCC === null && noteTP === null) {
      return noteExam; // Exam only
    } else if (noteCC === null) {
      // Exam + TP
      return noteExam * this.defaultNoteCoefs.exam_tp.exam + 
             noteTP * this.defaultNoteCoefs.exam_tp.tp;
    } else if (noteTP === null) {
      // Exam + CC
      return noteExam * this.defaultNoteCoefs.exam_cc.exam + 
             noteCC * this.defaultNoteCoefs.exam_cc.cc;
    } else {
      // Exam + CC + TP
      return noteExam * this.defaultNoteCoefs.exam_cc_tp.exam + 
             noteCC * this.defaultNoteCoefs.exam_cc_tp.cc + 
             noteTP * this.defaultNoteCoefs.exam_cc_tp.tp;
    }
  }

  // Group modules by UE and calculate group averages
  groupModulesByUE() {
    this.groupedData = {};

    // Initialize UE groups
    Object.entries(this.ueGroups).forEach(([ueName, ueInfo]) => {
      this.groupedData[ueName] = {
        name: ueName,
        modules: [],
        totalCredits: ueInfo.totalCredits,
        weightedScore: 0,
        moyenne: 0
      };
    });

    // Assign modules to UE groups
    this.currentData.forEach(module => {
      if (module.isGeneral) return;
      
      let assigned = false;
      
      for (const [ueName, ueInfo] of Object.entries(this.ueGroups)) {
        for (const ueModule of ueInfo.modules) {
          if (this.isModuleMatch(module.designation.toLowerCase(), ueModule.name.toLowerCase(), ueModule.aliases || [])) {
            this.groupedData[ueName].modules.push(module);
            if (module.moyenne !== null) {
              this.groupedData[ueName].weightedScore += module.moyenne * module.credits;
            }
            assigned = true;
            break;
          }
        }
        if (assigned) break;
      }
      
      // If not assigned to any UE, create individual group
      if (!assigned) {
        const groupName = `Non-classé: ${module.designation}`;
        this.groupedData[groupName] = {
          name: groupName,
          modules: [module],
          totalCredits: module.credits,
          weightedScore: module.moyenne !== null ? module.moyenne * module.credits : 0,
          moyenne: module.moyenne || 0
        };
      }
    });

    // Calculate UE averages
    let totalUEScore = 0;
    let totalUECredits = 0;

    Object.values(this.groupedData).forEach(ue => {
      if (ue.modules.length > 0) {
        const validModules = ue.modules.filter(m => m.moyenne !== null);
        const validCredits = validModules.reduce((sum, m) => sum + m.credits, 0);
        
        if (validCredits > 0) {
          ue.moyenne = ue.weightedScore / validCredits;
          totalUEScore += ue.moyenne * ue.totalCredits;
          totalUECredits += ue.totalCredits;
        }
      }
    });

    // Add general UE average
    const generalUEAverage = totalUECredits > 0 ? totalUEScore / totalUECredits : 0;
    this.groupedData["Moyenne Générale UE"] = {
      name: "Moyenne Générale UE",
      modules: [],
      totalCredits: totalUECredits,
      weightedScore: totalUEScore,
      moyenne: generalUEAverage,
      isGeneral: true
    };
  }

  // Create enhanced tables with both individual and grouped views
  createEnhancedTables() {
    // Remove existing enhanced tables
    const existingContainers = document.querySelectorAll('.grade-calculator-container');
    existingContainers.forEach(container => container.remove());

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'grade-calculator-container';
    
    // Create individual modules table
    const individualContainer = this.createIndividualTable();
    mainContainer.appendChild(individualContainer);
    
    // Create grouped modules table
    const groupedContainer = this.createGroupedTable();
    mainContainer.appendChild(groupedContainer);
    
    // Create export controls
    const exportContainer = this.createExportControls();
    mainContainer.appendChild(exportContainer);
    
    // Insert after original table
    this.originalTable.parentNode.insertBefore(mainContainer, this.originalTable.nextSibling);
  }

  // Create individual modules table
  createIndividualTable() {
    const container = document.createElement('div');
    container.className = 'table-container individual-table';
    
    const title = document.createElement('h3');
    title.textContent = 'Notes Individuelles avec Moyennes';
    title.className = 'table-title';
    container.appendChild(title);
    
    const table = document.createElement('table');
    table.className = 'enhanced-table';
    
    // Create header
    const header = `
      <thead>
        <tr>
          <th>Module</th>
          <th>Enseignant</th>
          <th>CC</th>
          <th>TP</th>
          <th>Examen</th>
          <th>Crédits</th>
          <th>Moyenne</th>
          <th>Actions</th>
        </tr>
      </thead>
    `;
    
    table.innerHTML = header;
    const tbody = document.createElement('tbody');
    
    this.currentData.forEach((module, index) => {
      const row = this.createIndividualRow(module, index);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    return container;
  }

  // Create individual module row
  createIndividualRow(module, index) {
    const row = document.createElement('tr');
    row.className = module.isGeneral ? 'general-row' : 'module-row';
    
    if (module.moyenne !== null) {
      row.classList.add(module.moyenne >= 8 ? 'passing' : 'failing');
    }
    
    // Add rattrapage indicator if applicable
    if (module.hasRattrapage) {
      row.classList.add('has-rattrapage');
    }
    
    const ccValue = module.noteCC !== null ? module.noteCC.toString().replace('.', ',') : '-';
    const tpValue = module.noteTP !== null ? module.noteTP.toString().replace('.', ',') : '-';
    const examValue = module.noteExam !== null ? module.noteExam.toString().replace('.', ',') : '-';
    const moyenneValue = module.moyenne !== null ? module.moyenne.toFixed(2).replace('.', ',') : '-';
    
    // Show rattrapage indicator in exam field if applicable
    const examDisplay = module.hasRattrapage ? `${examValue} (R)` : examValue;
    
    row.innerHTML = `
      <td class="module-name">${module.designation}${module.hasRattrapage ? ' <span class="rattrapage-badge">RATTRAPAGE</span>' : ''}</td>
      <td>${module.enseignant}</td>
      <td>
        ${module.isGeneral ? '-' : `<input type="text" class="grade-input cc-input" value="${ccValue}" data-index="${index}" data-type="cc">`}
      </td>
      <td>
        ${module.isGeneral ? '-' : `<input type="text" class="grade-input tp-input" value="${tpValue}" data-index="${index}" data-type="tp">`}
      </td>
      <td>
        ${module.isGeneral ? '-' : `<input type="text" class="grade-input exam-input ${module.hasRattrapage ? 'rattrapage-input' : ''}" value="${examValue}" data-index="${index}" data-type="exam" title="${module.hasRattrapage ? 'Note de rattrapage' : 'Note d\'examen'}">`}
      </td>
      <td>${module.credits}</td>
      <td class="moyenne-cell">${moyenneValue}</td>
      <td>
        ${module.isGeneral ? '' : `<button class="recalculate-btn" data-index="${index}">Recalculer</button>`}
      </td>
    `;
    
    // Add event listeners for real-time updates
    if (!module.isGeneral) {
      const inputs = row.querySelectorAll('.grade-input');
      inputs.forEach(input => {
        input.addEventListener('input', (e) => this.handleGradeInput(e));
        input.addEventListener('blur', (e) => this.validateGradeInput(e));
      });
      
      const recalculateBtn = row.querySelector('.recalculate-btn');
      if (recalculateBtn) {
        recalculateBtn.addEventListener('click', () => this.recalculateModule(index));
      }
    }
    
    return row;
  }

  // Create grouped modules table
  createGroupedTable() {
    const container = document.createElement('div');
    container.className = 'table-container grouped-table';
    
    const title = document.createElement('h3');
    title.textContent = 'Moyennes par Unité d\'Enseignement (UE)';
    title.className = 'table-title';
    container.appendChild(title);
    
    const table = document.createElement('table');
    table.className = 'enhanced-table grouped-table-content';
    
    const header = `
      <thead>
        <tr>
          <th>Unité d'Enseignement</th>
          <th>Modules Inclus</th>
          <th>Crédits UE</th>
          <th>Moyenne UE</th>
          <th>Status</th>
        </tr>
      </thead>
    `;
    
    table.innerHTML = header;
    const tbody = document.createElement('tbody');
    
    Object.values(this.groupedData).forEach(ue => {
      const row = this.createGroupedRow(ue);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    return container;
  }

  // Create grouped UE row
  createGroupedRow(ue) {
    const row = document.createElement('tr');
    row.className = ue.isGeneral ? 'general-row' : 'ue-row';
    
    if (ue.moyenne !== null && !ue.isGeneral) {
      row.classList.add(ue.moyenne >= 8 ? 'passing' : 'failing');
    }
    
    const modulesList = ue.modules.map(m => m.designation).join(', ') || '-';
    const moyenneValue = ue.moyenne.toFixed(2).replace('.', ',');
    const status = ue.isGeneral ? '' : (ue.moyenne >= 8 ? 'Validé' : 'Non validé');
    
    row.innerHTML = `
      <td class="ue-name">${ue.name}</td>
      <td class="modules-list" title="${modulesList}">${modulesList}</td>
      <td>${ue.totalCredits}</td>
      <td class="moyenne-cell">${moyenneValue}</td>
      <td class="status-cell">${status}</td>
    `;
    
    return row;
  }

  // Create export controls
  createExportControls() {
    const container = document.createElement('div');
    container.className = 'export-controls';
    
    container.innerHTML = `
      <h4>Exporter les résultats</h4>
      <div class="export-buttons">
        <button id="export-csv" class="export-btn">Exporter CSV</button>
        <button id="export-json" class="export-btn">Exporter JSON</button>
        <button id="print-results" class="export-btn">Imprimer</button>
      </div>
    `;
    
    // Add event listeners
    container.querySelector('#export-csv').addEventListener('click', () => this.exportToCSV());
    container.querySelector('#export-json').addEventListener('click', () => this.exportToJSON());
    container.querySelector('#print-results').addEventListener('click', () => this.printResults());
    
    return container;
  }

  // Handle grade input changes
  handleGradeInput(event) {
    const input = event.target;
    const index = parseInt(input.dataset.index);
    const type = input.dataset.type;
    
    // Parse and validate input
    let value = input.value.replace(',', '.');
    if (value === '' || value === '-') {
      value = null;
    } else {
      value = parseFloat(value);
      if (isNaN(value) || value < 0 || value > 20) {
        input.classList.add('invalid');
        return;
      }
    }
    
    input.classList.remove('invalid');
    
    // Update data
    if (this.currentData[index]) {
      switch (type) {
        case 'cc':
          this.currentData[index].noteCC = value;
          break;
        case 'tp':
          this.currentData[index].noteTP = value;
          break;
        case 'exam':
          this.currentData[index].noteExam = value;
          break;
      }
      
      // Auto-recalculate after 500ms delay
      clearTimeout(this.recalcTimeout);
      this.recalcTimeout = setTimeout(() => {
        this.recalculateAll();
      }, 500);
    }
  }

  // Validate grade input
  validateGradeInput(event) {
    const input = event.target;
    const value = parseFloat(input.value.replace(',', '.'));
    
    if (input.value !== '' && input.value !== '-') {
      if (isNaN(value) || value < 0 || value > 20) {
        input.classList.add('invalid');
        this.showNotification('Note invalide. Veuillez entrer une valeur entre 0 et 20.', 'error');
      } else {
        input.classList.remove('invalid');
      }
    }
  }

  // Recalculate specific module
  recalculateModule(index) {
    if (this.currentData[index] && !this.currentData[index].isGeneral) {
      this.currentData[index].moyenne = this.calculateModuleAverage(this.currentData[index]);
      this.updateModuleDisplay(index);
      this.recalculateAll();
    }
  }

  // Recalculate all averages
  recalculateAll() {
    // Remove general average from individual data
    this.currentData = this.currentData.filter(m => !m.isGeneral);
    
    // Recalculate individual averages
    this.calculateIndividualAverages();
    
    // Recalculate grouped averages
    this.groupModulesByUE();
    
    // Update displays
    this.updateAllDisplays();
  }

  // Update module display
  updateModuleDisplay(index) {
    const row = document.querySelectorAll('.module-row')[index];
    if (row) {
      const module = this.currentData[index];
      const moyenneCell = row.querySelector('.moyenne-cell');
      const moyenneValue = module.moyenne !== null ? module.moyenne.toFixed(2).replace('.', ',') : '-';
      moyenneCell.textContent = moyenneValue;
      
      // Update row styling
      row.classList.remove('passing', 'failing');
      if (module.moyenne !== null) {
        row.classList.add(module.moyenne >= 8 ? 'passing' : 'failing');
      }
    }
  }

  // Update all displays
  updateAllDisplays() {
    // Update individual table
    const individualRows = document.querySelectorAll('.module-row, .individual-table .general-row');
    this.currentData.forEach((module, index) => {
      if (individualRows[index]) {
        const moyenneCell = individualRows[index].querySelector('.moyenne-cell');
        const moyenneValue = module.moyenne !== null ? module.moyenne.toFixed(2).replace('.', ',') : '-';
        moyenneCell.textContent = moyenneValue;
        
        individualRows[index].classList.remove('passing', 'failing');
        if (module.moyenne !== null && !module.isGeneral) {
          individualRows[index].classList.add(module.moyenne >= 8 ? 'passing' : 'failing');
        }
      }
    });
    
    // Update grouped table
    const groupedRows = document.querySelectorAll('.ue-row, .grouped-table .general-row');
    const groupedValues = Object.values(this.groupedData);
    groupedValues.forEach((ue, index) => {
      if (groupedRows[index]) {
        const moyenneCell = groupedRows[index].querySelector('.moyenne-cell');
        const statusCell = groupedRows[index].querySelector('.status-cell');
        const moyenneValue = ue.moyenne.toFixed(2).replace('.', ',');
        
        moyenneCell.textContent = moyenneValue;
        
        if (statusCell && !ue.isGeneral) {
          statusCell.textContent = ue.moyenne >= 8 ? 'Validé' : 'Non validé';
          groupedRows[index].classList.remove('passing', 'failing');
          groupedRows[index].classList.add(ue.moyenne >= 8 ? 'passing' : 'failing');
        }
      }
    });
  }

  // Export to CSV
  exportToCSV() {
    try {
      let csv = "Type,Designation,Enseignant,CC,TP,Examen,Credits,Moyenne\n";
      
      // Add individual modules
      this.currentData.forEach(module => {
        const cc = module.noteCC !== null ? module.noteCC.toString().replace('.', ',') : '';
        const tp = module.noteTP !== null ? module.noteTP.toString().replace('.', ',') : '';
        const exam = module.noteExam !== null ? module.noteExam.toString().replace('.', ',') : '';
        const moyenne = module.moyenne !== null ? module.moyenne.toFixed(2).replace('.', ',') : '';
        
        csv += `Individuel,"${module.designation}","${module.enseignant}",${cc},${tp},${exam},${module.credits},${moyenne}\n`;
      });
      
      csv += "\n";
      
      // Add UE groups
      Object.values(this.groupedData).forEach(ue => {
        const modulesList = ue.modules.map(m => m.designation).join('; ');
        const moyenne = ue.moyenne.toFixed(2).replace('.', ',');
        
        csv += `UE,"${ue.name}","${modulesList}",,,,${ue.totalCredits},${moyenne}\n`;
      });
      
      this.downloadFile(csv, 'notes_esprit.csv', 'text/csv');
      this.showNotification('Export CSV réussi!', 'success');
      
    } catch (error) {
      console.error('Export CSV error:', error);
      this.showNotification('Erreur lors de l\'export CSV', 'error');
    }
  }

  // Export to JSON
  exportToJSON() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        individual_modules: this.currentData,
        ue_groups: this.groupedData,
        metadata: {
          total_modules: this.currentData.filter(m => !m.isGeneral).length,
          total_ues: Object.keys(this.groupedData).filter(k => !this.groupedData[k].isGeneral).length,
          general_average: this.currentData.find(m => m.isGeneral)?.moyenne || 0,
          general_ue_average: this.groupedData["Moyenne Générale UE"]?.moyenne || 0
        }
      };
      
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(json, 'notes_esprit.json', 'application/json');
      this.showNotification('Export JSON réussi!', 'success');
      
    } catch (error) {
      console.error('Export JSON error:', error);
      this.showNotification('Erreur lors de l\'export JSON', 'error');
    }
  }

  // Print results
  printResults() {
    const printWindow = window.open('', '_blank');
    const printContent = this.generatePrintContent();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Notes Esprit - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .passing { background-color: #d4edda; }
            .failing { background-color: #f8d7da; }
            .general-row { background-color: #e2e3e5; font-weight: bold; }
            h2, h3 { color: #333; }
            .print-header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  // Generate print content
  generatePrintContent() {
    const now = new Date();
    let content = `
      <div class="print-header">
        <h1>Relevé de Notes - Esprit</h1>
        <p>Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}</p>
      </div>
      
      <h2>Notes Individuelles</h2>
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Enseignant</th>
            <th>CC</th>
            <th>TP</th>
            <th>Examen</th>
            <th>Crédits</th>
            <th>Moyenne</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    this.currentData.forEach(module => {
      const cc = module.noteCC !== null ? module.noteCC.toString().replace('.', ',') : '-';
      const tp = module.noteTP !== null ? module.noteTP.toString().replace('.', ',') : '-';
      const exam = module.noteExam !== null ? module.noteExam.toString().replace('.', ',') : '-';
      const moyenne = module.moyenne !== null ? module.moyenne.toFixed(2).replace('.', ',') : '-';
      
      const rowClass = module.isGeneral ? 'general-row' : 
                      (module.moyenne !== null && module.moyenne >= 8 ? 'passing' : 'failing');
      
      content += `
        <tr class="${rowClass}">
          <td>${module.designation}</td>
          <td>${module.enseignant}</td>
          <td>${cc}</td>
          <td>${tp}</td>
          <td>${exam}</td>
          <td>${module.credits}</td>
          <td>${moyenne}</td>
        </tr>
      `;
    });
    
    content += `
        </tbody>
      </table>
      
      <h2>Moyennes par UE</h2>
      <table>
        <thead>
          <tr>
            <th>Unité d'Enseignement</th>
            <th>Crédits</th>
            <th>Moyenne</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    Object.values(this.groupedData).forEach(ue => {
      const moyenne = ue.moyenne.toFixed(2).replace('.', ',');
      const status = ue.isGeneral ? '' : (ue.moyenne >= 8 ? 'Validé' : 'Non validé');
      const rowClass = ue.isGeneral ? 'general-row' : 
                      (ue.moyenne >= 8 ? 'passing' : 'failing');
      
      content += `
        <tr class="${rowClass}">
          <td>${ue.name}</td>
          <td>${ue.totalCredits}</td>
          <td>${moyenne}</td>
          <td>${status}</td>
        </tr>
      `;
    });
    
    content += `
        </tbody>
      </table>
    `;
    
    return content;
  }

  // Download file helper
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.grade-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `grade-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize the calculator when the page loads
let gradeCalculator;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    gradeCalculator = new EspritGradeCalculator();
  });
} else {
  gradeCalculator = new EspritGradeCalculator();
}

// Export grades function for background script
function exportGrades() {
  if (gradeCalculator) {
    gradeCalculator.exportToJSON();
  }
}

// Calculator - Grade Calculator for Esprit Students
// Developed by Nasri Ayari
class EspritGradeCalculator {
  constructor() {
    this.currentData = [];
    this.groupedData = {};
    this.isCalculated = false;
    this.originalTable = null;

    // User-defined UE groups, initially empty for dynamic configuration
    this.ueGroups = {};

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

    // Search in user-defined ueGroups
    for (const ueGroup of Object.values(this.ueGroups)) {
      for (const module of ueGroup.modules) {
        if (lowerName === module.name.toLowerCase()) {
          return module.credits;
        }
      }
    }

    // Default credit if not found
    return 1;
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

  // Calculate individual module averages and update general average
  calculateIndividualAverages() {
    let totalWeightedScore = 0;
    let totalCredits = 0;

    // Only calculate for non-general modules
    this.currentData.forEach(module => {
      if (!module.isGeneral) {
        module.moyenne = this.calculateModuleAverage(module);
        
        if (module.moyenne !== null) {
          totalWeightedScore += module.moyenne * module.credits;
          totalCredits += module.credits;
        }
      }
    });

    // Update or add general average
    this.updateGeneralAverage(totalWeightedScore, totalCredits);
  }

  // Update general average with new values
  updateGeneralAverage(totalWeightedScore, totalCredits) {
    const generalAverage = totalCredits > 0 ? totalWeightedScore / totalCredits : 0;
    
    const existingGeneralIndex = this.currentData.findIndex(m => m.isGeneral);
    const generalModule = {
      designation: "Moyenne Générale Individuelle",
      enseignant: "",
      noteCC: null,
      noteTP: null,
      noteExam: null,
      credits: totalCredits,
      moyenne: generalAverage,
      isGeneral: true,
      hasRattrapage: false
    };

    if (existingGeneralIndex !== -1) {
      this.currentData[existingGeneralIndex] = generalModule;
    } else {
      this.currentData.push(generalModule);
    }
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

  // Group modules dynamically - creates UE groups from drag-and-drop interface or defaults to individual groups
  groupModulesByUE() {
    this.groupedData = {};

    // If UE groups are configured via drag-and-drop interface
    if (Object.keys(this.ueGroups).length > 0) {
      // Initialize configured UE groups
      Object.entries(this.ueGroups).forEach(([ueName, ueInfo]) => {
        this.groupedData[ueName] = {
          name: ueName,
          modules: [],
          totalCredits: ueInfo.totalCredits || 0,
          weightedScore: 0,
          moyenne: 0
        };
      });

      // Assign modules to configured UE groups
      this.currentData.forEach(module => {
        if (module.isGeneral) return;

        let assigned = false;

        for (const [ueName, ueInfo] of Object.entries(this.ueGroups)) {
          if (ueInfo.modules && ueInfo.modules.some(ueModule => 
            this.isModuleMatch(module.designation.toLowerCase(), ueModule.name.toLowerCase(), ueModule.aliases || []))) {
            this.groupedData[ueName].modules.push(module);
            if (module.moyenne !== null) {
              this.groupedData[ueName].weightedScore += module.moyenne * module.credits;
            }
            this.groupedData[ueName].totalCredits = this.groupedData[ueName].modules.reduce((sum, m) => sum + m.credits, 0);
            assigned = true;
            break;
          }
        }

        // If not assigned to any configured UE, create individual group
        if (!assigned) {
          const groupName = module.designation;
          this.groupedData[groupName] = {
            name: groupName,
            modules: [module],
            totalCredits: module.credits,
            weightedScore: module.moyenne !== null ? module.moyenne * module.credits : 0,
            moyenne: module.moyenne || 0
          };
        }
      });
    } else {
      // Default: Create individual groups for each module (fully generic approach)
      this.currentData.forEach(module => {
        if (module.isGeneral) return;

        const groupName = module.designation;
        this.groupedData[groupName] = {
          name: groupName,
          modules: [module],
          totalCredits: module.credits,
          weightedScore: module.moyenne !== null ? module.moyenne * module.credits : 0,
          moyenne: module.moyenne || 0
        };
      });
    }

    // Calculate UE averages with updated credits
    let totalUEScore = 0;
    let totalUECredits = 0;

    Object.values(this.groupedData).forEach(ue => {
      if (ue.modules.length > 0) {
        // Recalculate weighted score with current credits
        ue.weightedScore = 0;
        ue.totalCredits = 0;
        
        ue.modules.forEach(module => {
          if (module.moyenne !== null) {
            ue.weightedScore += module.moyenne * module.credits;
          }
          ue.totalCredits += module.credits;
        });

        if (ue.totalCredits > 0) {
          ue.moyenne = ue.weightedScore / ue.totalCredits;
          totalUEScore += ue.moyenne * ue.totalCredits;
          totalUECredits += ue.totalCredits;
        }
      }
    });

    // Only add general UE average if there are configured UE groups
    if (Object.keys(this.ueGroups).length > 0 && totalUECredits > 0) {
      const generalUEAverage = totalUEScore / totalUECredits;
      this.groupedData["Moyenne Générale UE"] = {
        name: "Moyenne Générale UE",
        modules: [],
        totalCredits: totalUECredits,
        weightedScore: totalUEScore,
        moyenne: generalUEAverage,
        isGeneral: true
      };
    }
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
    

    
    // Replace the original table with enhanced tables
    this.originalTable.style.display = 'none';
    this.originalTable.parentNode.insertBefore(mainContainer, this.originalTable.nextSibling);
    
    // Check for Projet d'Intégration modules and notify user
    const projetIntegrationModules = this.currentData.filter(module => 
      this.isProjetIntegrationModule(module.designation)
    );
    
    if (projetIntegrationModules.length > 0) {
      const moduleNames = projetIntegrationModules.map(m => m.designation).join(', ');
      this.showNotification(
        `⚠️ Modules Projet d'Intégration détectés: ${moduleNames}. Validation requise: ≥10/20 (au lieu de ≥8/20)`, 
        "info", 
        8000
      );
    }
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
    
    // Add special styling for Projet d'Intégration modules
    const isProjetIntegration = this.isProjetIntegrationModule(module.designation);
    if (isProjetIntegration) {
      row.classList.add('projet-integration-row');
    }
    
    if (module.moyenne !== null) {
      // Special validation for Projet d'Intégration modules - requires 10+ instead of 8+
      const passingGrade = isProjetIntegration ? 10 : 8;
      row.classList.add(module.moyenne >= passingGrade ? 'passing' : 'failing');
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
      <td>
        ${module.isGeneral ? module.credits : `<input type="number" class="credits-input" value="${module.credits}" data-index="${index}" min="1" max="20" title="Crédits modifiables">`}
      </td>
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
      
      // Add credits input event listener
      const creditsInput = row.querySelector('.credits-input');
      if (creditsInput) {
        creditsInput.addEventListener('input', (e) => this.handleCreditsChange(e));
        creditsInput.addEventListener('blur', (e) => this.validateCreditsInput(e));
      }
      
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

  // Create grouped UE row with drag-and-drop functionality
  createGroupedRow(ue) {
    const row = document.createElement('tr');
    row.className = ue.isGeneral ? 'general-row' : 'ue-row draggable-row';
    
    // Check if this UE contains Projet d'Intégration modules
    const isProjetIntegration = this.isProjetIntegrationModule(ue.name) || 
                               ue.modules.some(m => this.isProjetIntegrationModule(m.designation));
    
    if (isProjetIntegration) {
      row.classList.add('projet-integration-row');
    }
    
    if (ue.moyenne !== null && !ue.isGeneral) {
      // Special validation for Projet d'Intégration modules - requires 10+ instead of 8+
      const passingGrade = isProjetIntegration ? 10 : 8;
      row.classList.add(ue.moyenne >= passingGrade ? 'passing' : 'failing');
    }
    
    // Make non-general rows draggable
    if (!ue.isGeneral) {
      row.draggable = true;
      row.dataset.ueName = ue.name;
      
      // Add drag event listeners
      row.addEventListener('dragstart', (e) => this.handleDragStart(e));
      row.addEventListener('dragover', (e) => this.handleDragOver(e));
      row.addEventListener('drop', (e) => this.handleDrop(e));
      row.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }
    
    const modulesList = ue.modules.map(m => m.designation).join(', ') || '-';
    const moyenneValue = ue.moyenne.toFixed(2).replace('.', ',');
    
    // Use the already declared isProjetIntegration variable
    const passingGrade = isProjetIntegration ? 10 : 8;
    const status = ue.isGeneral ? '' : (ue.moyenne >= passingGrade ? 'Validé' : 'Non validé');
    
    row.innerHTML = `
      <td class="ue-name">
        ${!ue.isGeneral ? '<span class="drag-handle">⋮⋮</span>' : ''} 
        ${ue.name}
        ${!ue.isGeneral ? '<button class="split-ue-btn" title="Séparer cette UE">✂️</button>' : ''}
      </td>
      <td class="modules-list" title="${modulesList}">${modulesList}</td>
      <td class="credits-cell">${ue.totalCredits}</td>
      <td class="moyenne-cell">${moyenneValue}</td>
      <td class="status-cell">${status}</td>
    `;
    
    // Add split UE functionality
    if (!ue.isGeneral) {
      const splitBtn = row.querySelector('.split-ue-btn');
      if (splitBtn) {
        splitBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.splitUE(ue.name);
        });
      }
    }
    
    return row;
  }

  // Create export controls
  createExportControls() {
    const container = document.createElement('div');
    container.className = 'export-controls';
    
    container.innerHTML = `
      <h4>Exporter les résultats</h4>
      <div class="export-buttons">
        <button id="export-csv" class="export-btn">📊 Exporter CSV</button>
        <button id="export-json" class="export-btn">📄 Exporter JSON</button>
        <button id="export-pdf" class="export-btn">📋 Exporter PDF</button>
        <button id="print-results" class="export-btn">🖨️ Imprimer</button>
      </div>
    `;
    
    // Add event listeners
    container.querySelector('#export-csv').addEventListener('click', () => this.exportToCSV());
    container.querySelector('#export-json').addEventListener('click', () => this.exportToJSON());
    container.querySelector('#export-pdf').addEventListener('click', () => this.exportToPDF());
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
          const passingGrade = this.isProjetIntegrationModule(module.designation) ? 10 : 8;
          individualRows[index].classList.add(module.moyenne >= passingGrade ? 'passing' : 'failing');
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
          const isProjetIntegration = this.isProjetIntegrationModule(ue.name) || 
                                     ue.modules.some(m => this.isProjetIntegrationModule(m.designation));
          const passingGrade = isProjetIntegration ? 10 : 8;
          statusCell.textContent = ue.moyenne >= passingGrade ? 'Validé' : 'Non validé';
          groupedRows[index].classList.remove('passing', 'failing');
          groupedRows[index].classList.add(ue.moyenne >= passingGrade ? 'passing' : 'failing');
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
          <title>Calculator - Notes Esprit - ${new Date().toLocaleDateString()}</title>
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

  // Export to PDF with professional template
  async exportToPDF() {
    try {
      // Load jsPDF library if not already loaded
      if (typeof window.jsPDF === 'undefined') {
        await this.loadJsPDF();
      }

      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Generate PDF content
      this.generatePDFContent(doc);
      
      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Calculator_Notes_Esprit_${timestamp}_NasriAyari.pdf`;
      doc.save(filename);
      
      this.showNotification(`PDF exporté: ${filename} - Calculator by Nasri Ayari`, "success");
      
    } catch (error) {
      console.error("Error exporting PDF:", error);
      this.showNotification("Erreur lors de l'export PDF: " + error.message, "error");
    }
  }

  // Load jsPDF library dynamically
  async loadJsPDF() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load jsPDF library'));
      document.head.appendChild(script);
    });
  }

  // Generate PDF content with professional template
  generatePDFContent(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with professional design
    doc.setFillColor(102, 126, 234); // Purple gradient start color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Calculator - Relevé de Notes', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('École Supérieure Privée d\'Ingénierie et de Technologies (ESPRIT)', pageWidth / 2, 30, { align: 'center' });
    
    yPosition = 50;

    // Document info section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.text(`📅 Date d'export: ${currentDate}`, 20, yPosition);
    doc.text(`👨‍💻 Développé par: Nasri Ayari`, 20, yPosition + 5);
    doc.text(`🔧 Version: Calculator 2.0`, 20, yPosition + 10);
    
    yPosition += 25;

    // Individual modules section
    doc.setFillColor(248, 249, 250);
    doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('📚 Détail des Modules Individuels', 20, yPosition);
    yPosition += 15;

    // Individual modules table
    const individualTableData = this.prepareIndividualTableData();
    yPosition = this.drawPDFTable(doc, individualTableData.headers, individualTableData.rows, yPosition);
    
    yPosition += 15;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // UE Groups section
    doc.setFillColor(248, 249, 250);
    doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('🎓 Moyennes par Unité d\'Enseignement', 20, yPosition);
    yPosition += 15;

    // UE groups table
    const ueTableData = this.prepareUETableData();
    yPosition = this.drawPDFTable(doc, ueTableData.headers, ueTableData.rows, yPosition);

    // Summary section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 20;
    }

    // Summary box
    doc.setFillColor(220, 248, 198);
    doc.rect(15, yPosition - 5, pageWidth - 30, 40, 'F');
    doc.setDrawColor(40, 167, 69);
    doc.rect(15, yPosition - 5, pageWidth - 30, 40, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('📊 Résumé Général', 20, yPosition + 5);
    
    const generalAverage = this.currentData.find(m => m.isGeneral);
    if (generalAverage) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const avgText = `Moyenne Générale: ${generalAverage.moyenne.toFixed(2).replace('.', ',')} / 20`;
      const status = generalAverage.moyenne >= 10 ? '✅ Validé' : '❌ Non validé';
      
      if (generalAverage.moyenne >= 10) {
        doc.setTextColor(40, 167, 69);
      } else {
        doc.setTextColor(220, 53, 69);
      }
      
      doc.text(avgText, 20, yPosition + 18);
      doc.text(`Statut: ${status}`, 20, yPosition + 28);
    }

    // Footer
    doc.setFillColor(102, 126, 234);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Généré par Calculator - Extension Chrome développée par Nasri Ayari', pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(108, 117, 125);
      doc.setFontSize(8);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 20, pageHeight - 25, { align: 'right' });
    }
  }

  // Draw table in PDF with proper formatting
  drawPDFTable(doc, headers, rows, startY) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const tableWidth = pageWidth - 40;
    const colWidth = tableWidth / headers.length;
    let yPosition = startY;

    // Table headers
    doc.setFillColor(233, 236, 239);
    doc.rect(20, yPosition, tableWidth, 8, 'F');
    doc.setDrawColor(206, 212, 218);
    doc.rect(20, yPosition, tableWidth, 8, 'S');
    
    doc.setTextColor(33, 37, 41);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      const text = doc.splitTextToSize(header, colWidth - 4);
      doc.text(text, 22 + (index * colWidth), yPosition + 5);
    });
    
    yPosition += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
        
        // Redraw headers on new page
        doc.setFillColor(233, 236, 239);
        doc.rect(20, yPosition, tableWidth, 8, 'F');
        doc.setTextColor(33, 37, 41);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        headers.forEach((header, index) => {
          const text = doc.splitTextToSize(header, colWidth - 4);
          doc.text(text, 22 + (index * colWidth), yPosition + 5);
        });
        
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition, tableWidth, 6, 'F');
      }
      
      row.forEach((cell, colIndex) => {
        // Color coding for grades and status
        if (headers[colIndex] === 'Moyenne' || headers[colIndex] === 'Statut') {
          if (headers[colIndex] === 'Moyenne' && !isNaN(parseFloat(String(cell).replace(',', '.')))) {
            const grade = parseFloat(String(cell).replace(',', '.'));
            doc.setTextColor(grade >= 10 ? 40 : 220, grade >= 10 ? 167 : 53, grade >= 10 ? 69 : 69);
          } else if (headers[colIndex] === 'Statut') {
            doc.setTextColor(String(cell).includes('Validé') && !String(cell).includes('Non') ? 40 : 220, 
                           String(cell).includes('Validé') && !String(cell).includes('Non') ? 167 : 53, 69);
          }
        } else {
          doc.setTextColor(33, 37, 41);
        }
        
        const text = doc.splitTextToSize(String(cell), colWidth - 4);
        doc.text(text, 22 + (colIndex * colWidth), yPosition + 4);
      });
      
      yPosition += 6;
    });

    return yPosition;
  }

  // Prepare individual table data for PDF
  prepareIndividualTableData() {
    const headers = ['Module', 'Enseignant', 'CC', 'TP', 'Examen', 'Crédits', 'Moyenne'];
    const rows = [];
    
    this.currentData.forEach(module => {
      if (!module.isGeneral) {
        const row = [
          module.designation,
          module.enseignant || '-',
          module.noteCC !== null ? module.noteCC.toString().replace('.', ',') : '-',
          module.noteTP !== null ? module.noteTP.toString().replace('.', ',') : '-',
          module.noteExam !== null ? module.noteExam.toString().replace('.', ',') : '-',
          module.credits.toString(),
          module.moyenne !== null ? module.moyenne.toFixed(2).replace('.', ',') : '-'
        ];
        
        if (module.hasRattrapage) {
          row[0] += ' (R)'; // Mark rattrapage modules
        }
        
        rows.push(row);
      }
    });
    
    return { headers, rows };
  }

  // Prepare UE table data for PDF
  prepareUETableData() {
    const headers = ['Unité d\'Enseignement', 'Modules', 'Crédits', 'Moyenne', 'Statut'];
    const rows = [];
    
    Object.values(this.groupedData).forEach(ue => {
      if (!ue.isGeneral && ue.modules.length > 0) {
        const modulesList = ue.modules.map(m => m.designation).join(', ');
        const isProjetIntegration = this.isProjetIntegrationModule(ue.name) || 
                                   ue.modules.some(m => this.isProjetIntegrationModule(m.designation));
        const passingGrade = isProjetIntegration ? 10 : 8;
        const status = ue.moyenne >= passingGrade ? 'Validé' : 'Non validé';
        
        rows.push([
          ue.name,
          modulesList,
          ue.totalCredits.toString(),
          ue.moyenne.toFixed(2).replace('.', ','),
          status
        ]);
      }
    });
    
    return { headers, rows };
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
      
      const passingGrade = this.isProjetIntegrationModule(module.designation) ? 10 : 8;
      const rowClass = module.isGeneral ? 'general-row' : 
                      (module.moyenne !== null && module.moyenne >= passingGrade ? 'passing' : 'failing');
      
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
      const isProjetIntegration = this.isProjetIntegrationModule(ue.name) || 
                                 ue.modules.some(m => this.isProjetIntegrationModule(m.designation));
      const passingGrade = isProjetIntegration ? 10 : 8;
      const status = ue.isGeneral ? '' : (ue.moyenne >= passingGrade ? 'Validé' : 'Non validé');
      const rowClass = ue.isGeneral ? 'general-row' : 
                      (ue.moyenne >= passingGrade ? 'passing' : 'failing');
      
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

  // Extract unique module names from the grades table
  extractModulesFromTable() {
    const table = document.getElementById("ContentPlaceHolder1_GridView1");
    if (!table) return [];

    const modulesSet = new Set();
    const rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName("td");
      if (cells.length < 1) continue;
      const moduleName = cells[0]?.textContent.trim();
      if (moduleName) {
        modulesSet.add(moduleName);
      }
    }

    return Array.from(modulesSet);
  }

  // Drag and Drop Event Handlers for UE table grouping
  handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.ueName);
    e.target.classList.add('dragging');
    this.showNotification("Glissez sur une autre UE pour les fusionner", "info");
  }

  handleDragOver(e) {
    e.preventDefault();
    const targetRow = e.target.closest('tr');
    if (targetRow && targetRow.classList.contains('ue-row')) {
      targetRow.classList.add('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const draggedUEName = e.dataTransfer.getData('text/plain');
    const targetRow = e.target.closest('tr');
    const targetUEName = targetRow.dataset.ueName;
    
    // Remove drag-over class
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    if (draggedUEName && targetUEName && draggedUEName !== targetUEName) {
      this.mergeUEs(draggedUEName, targetUEName);
    }
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    // Remove all drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  }

  // Merge two UE groups
  mergeUEs(sourceUEName, targetUEName) {
    const sourceUE = this.groupedData[sourceUEName];
    const targetUE = this.groupedData[targetUEName];
    
    if (!sourceUE || !targetUE || sourceUE.isGeneral || targetUE.isGeneral) {
      this.showNotification("Impossible de fusionner ces UE", "error");
      return;
    }

    // Create new merged UE name
    const mergedName = `${targetUEName} + ${sourceUEName}`;
    
    // Merge modules and credits
    const mergedModules = [...targetUE.modules, ...sourceUE.modules];
    const mergedCredits = targetUE.totalCredits + sourceUE.totalCredits;
    const mergedWeightedScore = targetUE.weightedScore + sourceUE.weightedScore;
    
    // Calculate new average
    const validModules = mergedModules.filter(m => m.moyenne !== null);
    const validCredits = validModules.reduce((sum, m) => sum + m.credits, 0);
    const newAverage = validCredits > 0 ? mergedWeightedScore / validCredits : 0;
    
    // Create merged UE
    this.groupedData[mergedName] = {
      name: mergedName,
      modules: mergedModules,
      totalCredits: mergedCredits,
      weightedScore: mergedWeightedScore,
      moyenne: newAverage,
      isGeneral: false
    };
    
    // Remove original UEs
    delete this.groupedData[sourceUEName];
    delete this.groupedData[targetUEName];
    
    // Update UE groups configuration
    this.ueGroups[mergedName] = {
      modules: mergedModules.map(m => ({ name: m.designation, credits: m.credits })),
      totalCredits: mergedCredits
    };
    
    // Remove old configurations
    delete this.ueGroups[sourceUEName];
    delete this.ueGroups[targetUEName];
    
    // Refresh the display
    this.refreshGroupedTable();
    
    this.showNotification(`UE fusionnées: ${mergedName}`, "success");
  }

  // Split UE back into individual modules
  splitUE(ueName) {
    const ue = this.groupedData[ueName];
    if (!ue || ue.isGeneral) return;
    
    // Create individual groups for each module
    ue.modules.forEach(module => {
      const individualName = module.designation;
      this.groupedData[individualName] = {
        name: individualName,
        modules: [module],
        totalCredits: module.credits,
        weightedScore: module.moyenne !== null ? module.moyenne * module.credits : 0,
        moyenne: module.moyenne || 0,
        isGeneral: false
      };
    });
    
    // Remove the merged UE
    delete this.groupedData[ueName];
    delete this.ueGroups[ueName];
    
    // Refresh the display
    this.refreshGroupedTable();
    
    this.showNotification(`UE séparée: ${ueName}`, "info");
  }

  // Refresh only the grouped table
  refreshGroupedTable() {
    const existingGroupedTable = document.querySelector('.grouped-table');
    if (existingGroupedTable) {
      const newGroupedTable = this.createGroupedTable();
      existingGroupedTable.parentNode.replaceChild(newGroupedTable, existingGroupedTable);
    }
  }

  // Refresh both individual and grouped tables (used for major changes)
  refreshBothTables() {
    // Refresh individual table
    const existingIndividualTable = document.querySelector('.individual-table');
    if (existingIndividualTable) {
      const newIndividualTable = this.createIndividualTable();
      existingIndividualTable.parentNode.replaceChild(newIndividualTable, existingIndividualTable);
    }
    
    // Refresh grouped table
    this.refreshGroupedTable();
  }

  // Check if a module is a Projet d'Intégration module
  isProjetIntegrationModule(moduleName) {
    if (!moduleName) return false;
    
    const lowerName = moduleName.toLowerCase();
    return lowerName.includes('projet d\'intégration') || 
           lowerName.includes('projet d\'intégration') ||
           lowerName.includes('projet integration') ||
           lowerName.includes('pi ') ||
           lowerName.includes(' pi') ||
           lowerName === 'pi' ||
           lowerName.includes('p.i') ||
           (lowerName.includes('projet') && lowerName.includes('intégration'));
  }

  // Handle credits change in individual table
  handleCreditsChange(e) {
    const input = e.target;
    const index = parseInt(input.dataset.index);
    const newCredits = parseInt(input.value) || 1;
    
    // Clamp credits between 1-20
    const clampedCredits = Math.max(1, Math.min(20, newCredits));
    if (newCredits !== clampedCredits) {
      input.value = clampedCredits;
    }
    
    // Update the module data
    if (this.currentData[index] && !this.currentData[index].isGeneral) {
      this.currentData[index].credits = clampedCredits;
      
      // Recalculate general average with updated credits
      this.recalculateGeneralAverage();
      
      // Recalculate grouped data to reflect credit changes
      this.groupModulesByUE();
      
      // Update both tables with new values
      this.updateTablesRealTime();
      
      this.showNotification(`Crédits mis à jour: ${this.currentData[index].designation} (${clampedCredits} crédits)`, "info");
    }
  }

  // Recalculate general average when credits change
  recalculateGeneralAverage() {
    let totalWeightedScore = 0;
    let totalCredits = 0;

    this.currentData.forEach(module => {
      if (!module.isGeneral && module.moyenne !== null) {
        totalWeightedScore += module.moyenne * module.credits;
        totalCredits += module.credits;
      }
    });

    this.updateGeneralAverage(totalWeightedScore, totalCredits);
  }

  // Update tables in real-time without full refresh
  updateTablesRealTime() {
    // Update individual table general average row
    const individualTable = document.querySelector('.individual-table table');
    if (individualTable) {
      const generalRow = Array.from(individualTable.querySelectorAll('tr')).find(row => 
        row.querySelector('.module-name')?.textContent?.includes('Moyenne Générale Individuelle')
      );
      
      if (generalRow) {
        const generalModule = this.currentData.find(m => m.isGeneral);
        if (generalModule) {
          const creditsCell = generalRow.children[5]; // Credits column
          const moyenneCell = generalRow.children[6]; // Average column
          
          creditsCell.textContent = generalModule.credits;
          moyenneCell.textContent = generalModule.moyenne.toFixed(2).replace('.', ',');
        }
      }
    }

    // Update grouped table credits and averages
    const groupedTable = document.querySelector('.grouped-table table tbody');
    if (groupedTable) {
      const rows = groupedTable.querySelectorAll('tr');
      const groupedData = Object.values(this.groupedData);
      
      rows.forEach((row, index) => {
        if (groupedData[index]) {
          const creditsCell = row.children[2]; // Credits column
          const moyenneCell = row.children[3]; // Average column
          const statusCell = row.children[4]; // Status column
          
          if (creditsCell) creditsCell.textContent = groupedData[index].totalCredits;
          if (moyenneCell) moyenneCell.textContent = groupedData[index].moyenne.toFixed(2).replace('.', ',');
          
          if (statusCell && !groupedData[index].isGeneral) {
            const isProjetIntegration = this.isProjetIntegrationModule(groupedData[index].name) || 
                                       groupedData[index].modules.some(m => this.isProjetIntegrationModule(m.designation));
            const passingGrade = isProjetIntegration ? 10 : 8;
            statusCell.textContent = groupedData[index].moyenne >= passingGrade ? 'Validé' : 'Non validé';
            
            row.classList.remove('passing', 'failing');
            row.classList.add(groupedData[index].moyenne >= passingGrade ? 'passing' : 'failing');
          }
        }
      });
    }
  }

  // Validate credits input
  validateCreditsInput(e) {
    const input = e.target;
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 1 || value > 20) {
      input.classList.add('invalid');
      this.showNotification("Crédits doivent être entre 1 et 20", "warning");
    } else {
      input.classList.remove('invalid');
    }
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

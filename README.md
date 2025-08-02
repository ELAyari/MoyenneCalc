# Moyenne Calculator – Esprit Grade Calculator

**Developed by Nasri Ayari**

A comprehensive Chrome extension designed for **Esprit Cours du Soir** students to automatically calculate averages with proper UE (Unité d'Enseignement) grouping, advanced features, and enhanced functionality.

## ✨ Key Features

### Advanced Calculations

* **Dynamic UE Grouping**: Users can manually drag and drop modules into custom UE groups
* **Weighted Averages**: Credit-based averaging within each UE group
* **Real-time Updates**: Instant recalculation when grades are modified
* **Dual View**: Both individual module grades and UE group averages displayed
* **Rattrapage Handling**: Automatically detects and applies rattrapage grades from GridView2

### Enhanced User Experience

* **Modern Popup Interface**: Redesigned popup with status indicators and quick actions
* **Color Coding**: Visual indicators for passing (green) and failing (red) grades
* **Input Validation**: Real-time validation of grade inputs (0-20 range)
* **European Decimal Support**: Handles both comma (12,5) and dot (12.5) decimal formats
* **Interactive Drag-and-Drop Grouping**: Intuitive interface for custom UE creation and credit assignment

## 📋 Features Overview

### Core Functionality

* ✅ **Automatic Average Calculation**: Calculates per-subject and overall averages
* ✅ **Custom UE Group Management**: Drag-and-drop interface for dynamic grouping
* ✅ **Credit Weighting**: Credit-based average calculations per group
* ✅ **Missing Grade Handling**: Graceful handling of empty CC, TP, or Exam fields
* ✅ **Coefficient Fallback**: Intelligent coefficient assignment with fallback logic
* ✅ **Rattrapage Integration**: Automatically applies rattrapage grades with visual indicators

### Interactive Features

* ✅ **Editable Grades**: Modify any grade field for "what-if" scenarios
* ✅ **Real-time Recalculation**: Automatic updates with 500ms delay
* ✅ **Input Validation**: Prevents invalid grades (outside 0-20 range)
* ✅ **Status Indicators**: Visual feedback for calculation status
* ✅ **Keyboard Shortcuts**: Ctrl+R to calculate, Ctrl+E to export (JSON only)
* ✅ **Drag-and-Drop Grouping**: Intuitive interface for grouping modules and assigning credits

### Data Management

* ✅ **JSON Export**: Export custom groupings and grades for persistence or analysis
* ✅ **Error Handling**: Robust error management with user notifications
* ✅ **Data Validation**: Ensures data integrity throughout calculations
* ✅ **Special Module Handling**: Projet d'Intégration validation (requires ≥10 instead of ≥8)

## ⚙️ Installation Instructions

### Load Unpacked Extension

1. **Download the Extension**:

   * Clone this repository: `git clone https://github.com/ELAyari/MoyenneCalc.git`
   * Or download and extract the ZIP file

2. **Load in Chrome**:

   * Open Chrome and navigate to `chrome://extensions/`
   * Enable **Developer Mode**
   * Click **Load unpacked** and select the extension folder
   * The **Moyenne Calculator** will appear in your toolbar

## 📖 Usage Guide

### Getting Started

1. **Navigate to Grades Page**:

   * Log into the Esprit student portal
   * Go to your grades page (Notes/Résultats)
   * Ensure the grade table is visible

2. **Calculate Grades**:

   * Click the extension icon in Chrome toolbar
   * Click "Calculer les Notes"
   * Wait for calculations to complete

### Understanding the Results

#### Individual Modules Table

* Shows each module with calculated average
* Color-coded (green = passing, red = failing)
* Editable grade fields
* Rattrapage indicators

#### UE Groups Table

* Custom groups created by user via drag-and-drop
* Weighted average based on assigned credits
* Visual validation status (Validé/Non validé)
* Editable credit values

### Advanced Usage

* **Edit Grades**: Simulate various scenarios
* **Custom UE Grouping**: Create and manage UE groups manually
* **Assign Credits**: Each module in a UE group can be given a specific credit value

## 🔧 Configuration

### Default Grade Coefficients

* **Exam only**: 100% exam
* **Exam + CC**: 80% exam, 20% continuous assessment
* **Exam + TP**: 80% exam, 20% practical work
* **Exam + CC + TP**: 50% exam, 20% continuous assessment, 30% practical work

### Special Module Handling

* **Projet d'Intégration**: Requires ≥10/20 to pass
* **Rattrapage Grades**: Automatically detected and applied

## 😞 Troubleshooting

### Common Issues

**Extension not working?**

* Verify you're on the correct Esprit grades page
* Check browser console (F12) for errors
* Ensure the grade table ID matches expected structure

**Incorrect Calculations?**

* Ensure modules are correctly grouped
* Verify grade inputs are valid
* Confirm credits and coefficients are correctly applied

**Export Problems?**

* JSON format only supported
* Check browser download settings

## 🚀 Technical Details

### Architecture

* **Manifest V3**
* **Content Scripts**: Inject logic into Esprit grades page
* **Background Service Worker**: Handles lifecycle events
* **Popup Interface**: Modern interface using Vanilla JS

### File Structure

```
MoyenneCalc/
├── background.js          # Background service worker
├── content.js             # Injected script
├── popup.html             # UI
├── popup.js               # Logic
├── styles.css             # Styling
├── icon.png               # Icon
├── manifest.json          # Manifest V3
└── README.md              # Documentation
```

### Technologies

* **JavaScript (Vanilla)**
* **Chrome Extension APIs**
* **CSS3**

### Matching Algorithm

* Exact and fuzzy matching (Levenshtein distance)
* Alias support
* Special handling for ambiguous names

## 📄 License

Licensed under the MIT License - see the LICENSE file for details.

## 👨‍💼 Author

**Nasri Ayari**

* GitHub: [@ELAyari](https://github.com/ELAyari)
* Email: [nasri213a@gmail.com](mailto:nasri213a@gmail.com)

## 🙏 Acknowledgments

Thanks to Esprit students who provided feedback and testing.

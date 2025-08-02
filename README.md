# Moyenne Calculator – Esprit Grade Calculator

**Developed by Nasri Ayari**

A comprehensive Chrome extension designed for **Esprit Cours du Soir** students to automatically calculate averages with proper UE (Unité d'Enseignement) grouping, advanced features, and enhanced functionality.

## 🚀 Key Features

### Advanced Calculations
- **Proper UE Grouping**: Modules are correctly grouped by their respective Unités d'Enseignement
- **Weighted Averages**: Credit-based averaging within each UE group
- **Real-time Updates**: Instant recalculation when grades are modified
- **Dual View**: Both individual module grades and UE group averages displayed separately
- **Rattrapage Handling**: Automatically detects and applies rattrapage grades from GridView2

### Enhanced User Experience
- **Modern Popup Interface**: Redesigned popup with status indicators and quick actions
- **Color Coding**: Visual indicators for passing (≥8 or ≥10 for Projet d'Intégration, green) and failing (<8 or <10 for Projet d'Intégration, red) grades
- **Input Validation**: Real-time validation of grade inputs (0-20 range)
- **European Decimal Support**: Handles both comma (12,5) and dot (12.5) decimal formats
- **Drag-and-Drop UE Grouping**: Intuitive interface for custom UE grouping

### Export & Print Capabilities
- **CSV Export**: Detailed export with individual modules and UE groups
- **JSON Export**: Complete data export including metadata and timestamps
- **PDF Export**: Professional PDF reports with jsPDF library
- **Print Functionality**: Professional print layout for grade reports
- **Data Persistence**: Maintains calculation state across page reloads

## 📋 Features Overview

### Core Functionality
- ✅ **Automatic Average Calculation**: Calculates per-subject and overall averages
- ✅ **UE Group Management**: Proper grouping according to Esprit curriculum
- ✅ **Credit Weighting**: Accurate credit-based average calculations
- ✅ **Missing Grade Handling**: Graceful handling of empty CC, TP, or Exam fields
- ✅ **Coefficient Fallback**: Intelligent coefficient assignment with fallback logic
- ✅ **Rattrapage Integration**: Automatically applies rattrapage grades with visual indicators

### Interactive Features
- ✅ **Editable Grades**: Modify any grade field for "what-if" scenarios
- ✅ **Real-time Recalculation**: Automatic updates with 500ms delay
- ✅ **Input Validation**: Prevents invalid grades (outside 0-20 range)
- ✅ **Status Indicators**: Visual feedback for calculation status
- ✅ **Keyboard Shortcuts**: Ctrl+R to calculate, Ctrl+E to export
- ✅ **Drag-and-Drop Grouping**: Intuitive UE grouping interface

### Data Management
- ✅ **Multiple Export Formats**: CSV, JSON, PDF, and Print options
- ✅ **Comprehensive Data**: Individual modules, UE groups, and metadata
- ✅ **Error Handling**: Robust error management with user notifications
- ✅ **Data Validation**: Ensures data integrity throughout calculations
- ✅ **Special Module Handling**: Projet d'Intégration validation (≥10 instead of ≥8)

## 🛠 Installation Instructions

### Method 1: Load Unpacked Extension

1. **Download the Extension**:
   - Clone this repository: `git clone https://github.com/ELAyari/MoyenneCalc.git`
   - Or download and extract the ZIP file

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top right)
   - Click **Load unpacked** and select the extension folder
   - The **Moyenne Calculator** will appear in your toolbar

### Method 2: Install from Chrome Web Store
*Coming soon - extension will be published to Chrome Web Store*

## 📖 Usage Guide

### Getting Started
1. **Navigate to Grades Page**:
   - Log into the Esprit student portal
   - Go to your grades page (Notes/Résultats)
   - Ensure the grade table is visible

2. **Calculate Grades**:
   - Click the extension icon in Chrome toolbar
   - Click "Calculer les Notes" button
   - Wait for calculations to complete (green status indicator)

### Understanding the Results
The extension creates two enhanced tables:

#### Individual Modules Table
- Shows each module with calculated average
- Color-coded rows (green = passing, red = failing)
- Editable grade fields for simulation
- Real-time recalculation capabilities
- Special indicators for rattrapage grades and Projet d'Intégration modules

#### UE Groups Table
- Modules grouped by Unité d'Enseignement
- Weighted averages based on module credits
- UE validation status (Validé/Non validé)
- Total credits per UE
- Drag-and-drop functionality for custom grouping

### Advanced Usage
- **Edit Grades**: Click on any grade field to modify values
- **Simulate Scenarios**: Change grades to see impact on averages
- **Export Data**: Use export buttons for external analysis
- **Print Results**: Generate professional grade reports
- **Custom UE Grouping**: Drag and drop modules to create custom UE groups
- **Split UE Groups**: Break apart merged UE groups with the split button

## 🎯 UE Group Structure

The extension recognizes the following UE groups:

| UE Group | Modules | Total Credits |
|----------|---------|---------------|
| **Algorithmique et résolution de problèmes** | Algorithmique et structure de données (3), Analyse numérique (2) | 5 |
| **Modélisation et Programmation par Objet** | Conception par Objet et Programmation Java (4), Outil collaboratif GIT (1), Langage de modélisation UML (3) | 8 |
| **Communication, Culture et Citoyenneté F1** | Communication, Culture et Citoyenneté F1_PR (2) | 2 |
| **Communication, Culture et Citoyenneté A1** | Communication, Culture et Citoyenneté A1_PR (2) | 2 |
| **Développement Web** | Technologies Web 2.0 (3), Application coté client Angular-1 (2), Java scripts coté serveur (2) | 7 |
| **Fondements des TIC** | Bases de Données (2), SGBD (3) | 5 |
| **Fondements système et réseaux** | Système et scripting (2), Fondements des Réseaux (3) | 5 |
| **Projet d'intégration** | Projet d'Intégration Java/Mobile (6) | 6 |

## ⚙️ Configuration

### Default Grade Coefficients
- **Exam only**: 100% exam
- **Exam + CC**: 80% exam, 20% continuous assessment
- **Exam + TP**: 80% exam, 20% practical work
- **Exam + CC + TP**: 50% exam, 20% continuous assessment, 30% practical work

### Module Credit Assignment
The extension automatically assigns credits based on the UE structure. Unrecognized modules receive a default credit value of 1.

### Special Module Handling
- **Projet d'Intégration**: Requires ≥10/20 to pass instead of the standard ≥8/20
- **Rattrapage Grades**: Automatically detected and applied with visual indicators

## 🐛 Troubleshooting

### Common Issues

**Extension not working?**
- Verify you're on the correct Esprit grades page
- Check browser console for error messages (F12 → Console)
- Ensure the grade table has ID `ContentPlaceHolder1_GridView1`

**Calculations seem wrong?**
- Verify module names match the expected UE structure
- Check for missing or invalid grade values
- Ensure credits are correctly assigned
- Check if rattrapage grades are being applied correctly

**Export not working?**
- Check browser's download settings
- Ensure popup blockers aren't interfering
- Try different export formats
- Verify jsPDF library loads correctly for PDF exports

### Debug Mode
Enable debug logging by opening browser console (F12) before using the extension. Error messages and calculation details will be displayed.

## 🚀 Technical Details

### Architecture
- **Manifest V3**: Latest Chrome extension standard
- **Content Scripts**: Inject calculation logic into grade pages
- **Background Service Worker**: Handle extension lifecycle and messaging
- **Popup Interface**: Modern React-like interface without dependencies

### File Structure
```
MoyenneCalc/
├── background.js          # Background service worker
├── content.js             # Content script for grade calculations
├── popup.html             # Popup UI
├── popup.js               # Popup controller logic
├── styles.css             # Styling for both popup and content
├── icon.png               # Extension icon
├── manifest.json          # Extension manifest
└── README.md              # This file
```

### Technologies Used
- **Vanilla JavaScript**: No external frameworks
- **Chrome Extension APIs**: For browser integration
- **jsPDF**: For PDF export functionality
- **CSS3**: For modern styling and animations

### Module Matching Algorithm
The extension uses a sophisticated matching algorithm to correctly identify modules:
- Exact string matching for precise identification
- Levenshtein distance for fuzzy matching of similar module names
- Special handling for Communication modules to prevent cross-matching
- Alias support for modules with multiple possible names

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nasri Ayari**
- GitHub: [@ELAyari](https://github.com/ELAyari)
- Email: nasri.ayari.dev@gmail.com

## 🙏 Acknowledgments

- Thanks to Esprit students who provided feedback and testing

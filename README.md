# Calculator – Esprit Grade Calculator

**Developed by Nasri Ayari**

A comprehensive Chrome extension designed for **Esprit Cours du Soir** students to automatically calculate averages with proper UE (Unité d'Enseignement) grouping, advanced features, and enhanced functionality.

## 🚀 New Features (Version 2.0)

### Advanced Calculations
- **Proper UE Grouping**: Modules are correctly grouped by their respective Unités d'Enseignement
- **Weighted Averages**: Credit-based averaging within each UE group
- **Real-time Updates**: Instant recalculation when grades are modified
- **Dual View**: Both individual module grades and UE group averages displayed separately

### Enhanced User Experience
- **Modern Popup Interface**: Redesigned popup with status indicators and quick actions
- **Color Coding**: Visual indicators for passing (≥8, green) and failing (<8, red) grades
- **Input Validation**: Real-time validation of grade inputs (0-20 range)
- **European Decimal Support**: Handles both comma (12,5) and dot (12.5) decimal formats

### Export & Print Capabilities
- **CSV Export**: Detailed export with individual modules and UE groups
- **JSON Export**: Complete data export including metadata and timestamps
- **Print Functionality**: Professional print layout for grade reports
- **Data Persistence**: Maintains calculation state across page reloads

## 📋 Features Overview

### Core Functionality
- ✅ **Automatic Average Calculation**: Calculates per-subject and overall averages
- ✅ **UE Group Management**: Proper grouping according to Esprit curriculum
- ✅ **Credit Weighting**: Accurate credit-based average calculations
- ✅ **Missing Grade Handling**: Graceful handling of empty CC, TP, or Exam fields
- ✅ **Coefficient Fallback**: Intelligent coefficient assignment with fallback logic

### Interactive Features
- ✅ **Editable Grades**: Modify any grade field for "what-if" scenarios
- ✅ **Real-time Recalculation**: Automatic updates with 500ms delay
- ✅ **Input Validation**: Prevents invalid grades (outside 0-20 range)
- ✅ **Status Indicators**: Visual feedback for calculation status
- ✅ **Keyboard Shortcuts**: Ctrl+R to calculate, Ctrl+E to export

### Data Management
- ✅ **Multiple Export Formats**: CSV, JSON, and Print options
- ✅ **Comprehensive Data**: Individual modules, UE groups, and metadata
- ✅ **Error Handling**: Robust error management with user notifications
- ✅ **Data Validation**: Ensures data integrity throughout calculations

## 🛠 Installation Instructions

### Method 1: Load Unpacked Extension

1. **Download the Extension**:
   - Clone this repository: `git clone https://github.com/ELAyari/MoyenneCalc.git`
   - Or download and extract the ZIP file

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top right)
   - Click **Load unpacked** and select the extension folder
   - The **Enhanced Grade Calculator** will appear in your toolbar

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

#### UE Groups Table
- Modules grouped by Unité d'Enseignement
- Weighted averages based on module credits
- UE validation status (Validé/Non validé)
- Total credits per UE

### Advanced Usage
- **Edit Grades**: Click on any grade field to modify values
- **Simulate Scenarios**: Change grades to see impact on averages
- **Export Data**: Use export buttons for external analysis
- **Print Results**: Generate professional grade reports

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

**Export not working?**
- Check browser's download settings
- Ensure popup blockers aren't interfering
- Try different export formats

### Debug Mode
Enable debug logging by opening browser console (F12) before using the extension. Error messages and calculation details will be displayed.

## 🚀 Technical Details

### Architecture
- **Manifest V3**: Latest Chrome extension standard
- **Content Scripts**: Inject calculation logic into grade pages
- **Background Service Worker**: Handle extension lifecycle and messaging
- **Popup Interface**: Modern React-like interface without dependencies

### File Structure

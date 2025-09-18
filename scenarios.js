// Clinical Scenarios Module
class ClinicalScenariosModule {
    constructor(studentProgress, achievementManager) {
        this.studentProgress = studentProgress;
        this.achievementManager = achievementManager;
        this.currentScenario = null;
        this.scenarioData = {
            'diabetic-ed': {
                title: 'Diabetic Patient in Emergency Department',
                description: 'A 45-year-old diabetic patient presents to the Emergency Department at 2 AM with altered mental status. The patient is unable to provide medical history.',
                pathways: {
                    'without-standards': {
                        title: 'Without Standards',
                        description: 'ED physician calls primary care office, waits on hold, gets partial medication list verbally, misses recent A1C result, orders duplicate tests',
                        metrics: {
                            time: '45 minutes',
                            cost: '$850',
                            risk: 'High',
                            duplicateTests: 3
                        }
                    },
                    'standards-no-interop': {
                        title: 'With Standards but No Interoperability',
                        description: 'Systems have LOINC codes for A1C, but ED system can\'t query primary care system. Data exists but isn\'t accessible',
                        metrics: {
                            time: '30 minutes',
                            cost: '$650',
                            risk: 'Medium',
                            duplicateTests: 2
                        }
                    },
                    'full-interop': {
                        title: 'With Full Interoperability',
                        description: 'ED system automatically queries regional HIE using patient identifier (IHE PIX), retrieves recent A1C coded as LOINC 4548-4, medication list with RxNorm codes triggers interaction warning, previous discharge summary (C-CDA) shows recent admission',
                        metrics: {
                            time: '5 minutes',
                            cost: '$200',
                            risk: 'Low',
                            duplicateTests: 0
                        }
                    }
                }
            },
            'medication-reconciliation': {
                title: 'Medication Reconciliation',
                description: 'Patient transferring from ED to primary care clinic needs medication reconciliation.',
                pathways: {
                    'manual': {
                        title: 'Manual Process',
                        description: 'Nurse calls pharmacy, manually compares lists, high error rate',
                        metrics: {
                            time: '20 minutes',
                            accuracy: '75%',
                            errors: 2
                        }
                    },
                    'semi-automated': {
                        title: 'Semi-Automated',
                        description: 'Electronic lists but manual comparison, some drug interaction checking',
                        metrics: {
                            time: '10 minutes',
                            accuracy: '90%',
                            errors: 1
                        }
                    },
                    'fully-automated': {
                        title: 'Fully Automated',
                        description: 'RxNorm coded medications, automated interaction checking, FHIR-based reconciliation',
                        metrics: {
                            time: '2 minutes',
                            accuracy: '98%',
                            errors: 0
                        }
                    }
                }
            }
        };
    }

    showScenario(scenarioId) {
        this.currentScenario = scenarioId;
        const scenario = this.scenarioData[scenarioId];
        
        if (!scenario) return;
        
        const scenarioContainer = document.getElementById('scenarioContainer');
        scenarioContainer.innerHTML = `
            <div class="scenario-header">
                <h3>${scenario.title}</h3>
                <p>${scenario.description}</p>
            </div>
            <div class="scenario-content">
                <h4>Choose your approach:</h4>
                <div class="decision-tree">
                    ${Object.entries(scenario.pathways).map(([key, pathway]) => `
                        <div class="decision-option" data-pathway="${key}" onclick="clinicalScenarios.selectPathway('${key}')">
                            <h5>${pathway.title}</h5>
                            <p>${pathway.description}</p>
                        </div>
                    `).join('')}
                </div>
                <div id="consequenceDisplay" class="consequence-display"></div>
            </div>
        `;
        
        scenarioContainer.style.display = 'block';
    }

    selectPathway(pathwayKey) {
        const pathway = this.scenarioData[this.currentScenario].pathways[pathwayKey];
        
        // Remove previous selections
        document.querySelectorAll('.decision-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Mark selected option
        document.querySelector(`[data-pathway="${pathwayKey}"]`).classList.add('selected');
        
        // Show consequences in modal
        if (window.modalManager) {
            const content = `
                <div class="modal-description">Consequences of ${pathway.title}</div>
                <div class="modal-section">
                    <div class="modal-section-title">Impact Metrics</div>
                    <div class="modal-stats">
                        ${Object.entries(pathway.metrics).map(([key, value]) => `
                            <div class="modal-stat">
                                <div class="modal-stat-value">${value}</div>
                                <div class="modal-stat-label">${this.formatMetricLabel(key)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-section">
                    <div class="modal-section-title">Analysis</div>
                    <div class="modal-highlight">
                        ${this.getPathwayAnalysis(pathwayKey)}
                    </div>
                </div>
            `;
            window.modalManager.show('Pathway Analysis', content, true, 'Continue');
        } else {
            // Fallback to inline display
            const consequenceDisplay = document.getElementById('consequenceDisplay');
            consequenceDisplay.innerHTML = `
                <h4>Consequences of ${pathway.title}:</h4>
                <div class="metrics-grid">
                    ${Object.entries(pathway.metrics).map(([key, value]) => `
                        <div class="metric-item">
                            <div class="metric-value">${value}</div>
                            <div class="metric-label">${this.formatMetricLabel(key)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="consequence-analysis">
                    <h5>Analysis:</h5>
                    <p>${this.getPathwayAnalysis(pathwayKey)}</p>
                </div>
            `;
            consequenceDisplay.classList.add('show');
        }
        
        // Award points based on pathway selection
        this.awardPathwayPoints(pathwayKey);
    }

    formatMetricLabel(key) {
        const labels = {
            time: 'Time to Resolution',
            cost: 'Cost Impact',
            risk: 'Patient Risk',
            duplicateTests: 'Duplicate Tests',
            accuracy: 'Accuracy Rate',
            errors: 'Potential Errors'
        };
        return labels[key] || key;
    }

    getPathwayAnalysis(pathwayKey) {
        const analyses = {
            'without-standards': 'This approach leads to significant delays, increased costs, and higher patient risk due to lack of standardized data exchange.',
            'standards-no-interop': 'Having standards without interoperability means data exists but cannot be effectively shared, leading to partial improvements.',
            'full-interop': 'Full interoperability provides optimal patient care with minimal delays, costs, and risks through seamless data exchange.',
            'manual': 'Manual processes are time-consuming and error-prone, leading to potential patient safety issues.',
            'semi-automated': 'Semi-automated processes provide moderate improvements but still require significant manual intervention.',
            'fully-automated': 'Fully automated processes provide the best outcomes with minimal human intervention and maximum accuracy.'
        };
        return analyses[pathwayKey] || 'Analysis not available.';
    }

    awardPathwayPoints(pathwayKey) {
        const pointValues = {
            'without-standards': 5,
            'standards-no-interop': 10,
            'full-interop': 20,
            'manual': 5,
            'semi-automated': 10,
            'fully-automated': 20
        };
        
        const points = pointValues[pathwayKey] || 5;
        this.studentProgress.totalPoints += points;
        this.studentProgress.saveProgress();
    }

    completeScenario() {
        if (!this.currentScenario) return;
        
        this.studentProgress.scenariosCompleted.push(this.currentScenario);
        
        // Check if all scenarios are completed
        if (this.studentProgress.scenariosCompleted.length >= 2) {
            if (!this.studentProgress.achievements.includes('Clinical Connector')) {
                this.studentProgress.achievements.push('Clinical Connector');
                this.achievementManager.showAchievement('Clinical Connector', '🏥', 'Solved 3 clinical scenarios correctly');
            }
        }
        
        this.studentProgress.saveProgress();
    }
}

// Master Challenge Module
class MasterChallengeModule {
    constructor(studentProgress, achievementManager) {
        this.studentProgress = studentProgress;
        this.achievementManager = achievementManager;
        this.selectedComponents = [];
        this.solution = {
            standards: [],
            architecture: [],
            workflow: [],
            risks: []
        };
    }

    showChallenge() {
        // Show the quiz questions with smooth animation
        const masterQuizContainer = document.getElementById('masterQuizContainer');
        if (masterQuizContainer) {
            masterQuizContainer.style.display = 'block';
            // Add animation class after a short delay for smooth transition
            setTimeout(() => {
                masterQuizContainer.classList.add('show');
            }, 100);
        }
        
        // Hide the start button
        const showChallengeButton = document.getElementById('showChallenge');
        if (showChallengeButton) {
            showChallengeButton.style.display = 'none';
        }
        
        const challengeContainer = document.getElementById('challengeContainer');
        challengeContainer.innerHTML = `
            <div class="challenge-builder">
                <h3>🎯 Master Challenge: Design Interoperability Solution</h3>
                <p><strong>Challenge:</strong> Design a minimum viable interoperability solution for medication reconciliation between an ED and primary care clinic. Which standards would you prioritize and why?</p>
                
                <div class="component-selector">
                    <h4>Select Standards:</h4>
                    <div class="standards-grid">
                        <div class="component-item" data-component="hl7-fhir" onclick="masterChallenge.selectComponent('hl7-fhir')">
                            <h5>HL7 FHIR</h5>
                            <p>Modern web-friendly standard</p>
                            <small>Cost: Medium | Complexity: Medium</small>
                        </div>
                        <div class="component-item" data-component="hl7-v2" onclick="masterChallenge.selectComponent('hl7-v2')">
                            <h5>HL7 v2</h5>
                            <p>Widely adopted messaging</p>
                            <small>Cost: Low | Complexity: High</small>
                        </div>
                        <div class="component-item" data-component="rxnorm" onclick="masterChallenge.selectComponent('rxnorm')">
                            <h5>RxNorm</h5>
                            <p>Drug terminology standard</p>
                            <small>Cost: Medium | Complexity: Medium</small>
                        </div>
                        <div class="component-item" data-component="loinc" onclick="masterChallenge.selectComponent('loinc')">
                            <h5>LOINC</h5>
                            <p>Lab and clinical observations</p>
                            <small>Cost: Medium | Complexity: Medium</small>
                        </div>
                        <div class="component-item" data-component="snomed-ct" onclick="masterChallenge.selectComponent('snomed-ct')">
                            <h5>SNOMED-CT</h5>
                            <p>Clinical terminology</p>
                            <small>Cost: High | Complexity: High</small>
                        </div>
                        <div class="component-item" data-component="ihe-profiles" onclick="masterChallenge.selectComponent('ihe-profiles')">
                            <h5>IHE Profiles</h5>
                            <p>Implementation guides</p>
                            <small>Cost: Low | Complexity: Low</small>
                        </div>
                    </div>
                </div>
                
                <div class="architecture-canvas" id="architectureCanvas">
                    <h4>Your Solution Architecture</h4>
                    <p>Selected components will appear here</p>
                </div>
                
                <div class="solution-summary" id="solutionSummary" style="display: none;">
                    <h4>Solution Summary</h4>
                    <div id="summaryContent"></div>
                </div>
                
                <div style="text-align: center; margin: 2rem 0;">
                    <button id="evaluateSolution" onclick="masterChallenge.evaluateSolution()" style="background: var(--primary-blue); color: white; padding: 1rem 2rem; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer;">
                        Evaluate My Solution
                    </button>
                </div>
            </div>
        `;
        
        challengeContainer.style.display = 'block';
    }

    selectComponent(componentId) {
        const component = document.querySelector(`[data-component="${componentId}"]`);
        
        if (this.selectedComponents.includes(componentId)) {
            // Remove component
            this.selectedComponents = this.selectedComponents.filter(id => id !== componentId);
            component.classList.remove('selected');
        } else {
            // Add component
            this.selectedComponents.push(componentId);
            component.classList.add('selected');
        }
        
        this.updateArchitectureCanvas();
    }

    updateArchitectureCanvas() {
        const canvas = document.getElementById('architectureCanvas');
        const summary = document.getElementById('solutionSummary');
        
        if (this.selectedComponents.length === 0) {
            canvas.innerHTML = `
                <h4>Your Solution Architecture</h4>
                <p>Selected components will appear here</p>
            `;
            summary.style.display = 'none';
            return;
        }
        
        canvas.innerHTML = `
            <h4>Your Solution Architecture</h4>
            <div class="architecture-diagram">
                ${this.selectedComponents.map(component => `
                    <div class="architecture-component">
                        <h5>${this.getComponentName(component)}</h5>
                        <p>${this.getComponentDescription(component)}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        summary.style.display = 'block';
        this.updateSolutionSummary();
    }

    getComponentName(componentId) {
        const names = {
            'hl7-fhir': 'HL7 FHIR',
            'hl7-v2': 'HL7 v2',
            'rxnorm': 'RxNorm',
            'loinc': 'LOINC',
            'snomed-ct': 'SNOMED-CT',
            'ihe-profiles': 'IHE Profiles'
        };
        return names[componentId] || componentId;
    }

    getComponentDescription(componentId) {
        const descriptions = {
            'hl7-fhir': 'Modern web-friendly standard for medication resources',
            'hl7-v2': 'Traditional messaging standard for medication data',
            'rxnorm': 'Standardized drug terminology for medication reconciliation',
            'loinc': 'Laboratory and clinical observation codes',
            'snomed-ct': 'Comprehensive clinical terminology',
            'ihe-profiles': 'Implementation guides for interoperability'
        };
        return descriptions[componentId] || 'Component description';
    }

    updateSolutionSummary() {
        const summaryContent = document.getElementById('summaryContent');
        
        const analysis = this.analyzeSolution();
        
        summaryContent.innerHTML = `
            <div class="solution-analysis">
                <h5>Solution Analysis:</h5>
                <p><strong>Standards Selected:</strong> ${this.selectedComponents.length}</p>
                <p><strong>Estimated Implementation Cost:</strong> ${analysis.cost}</p>
                <p><strong>Complexity Level:</strong> ${analysis.complexity}</p>
                <p><strong>Expected Benefits:</strong> ${analysis.benefits}</p>
                <p><strong>Key Risks:</strong> ${analysis.risks}</p>
            </div>
        `;
    }

    analyzeSolution() {
        const costMap = {
            'hl7-fhir': 2,
            'hl7-v2': 1,
            'rxnorm': 2,
            'loinc': 2,
            'snomed-ct': 3,
            'ihe-profiles': 1
        };
        
        const complexityMap = {
            'hl7-fhir': 2,
            'hl7-v2': 3,
            'rxnorm': 2,
            'loinc': 2,
            'snomed-ct': 3,
            'ihe-profiles': 1
        };
        
        const totalCost = this.selectedComponents.reduce((sum, comp) => sum + costMap[comp], 0);
        const totalComplexity = this.selectedComponents.reduce((sum, comp) => sum + complexityMap[comp], 0);
        
        let costLevel = 'Low';
        if (totalCost >= 8) costLevel = 'High';
        else if (totalCost >= 5) costLevel = 'Medium';
        
        let complexityLevel = 'Low';
        if (totalComplexity >= 8) complexityLevel = 'High';
        else if (totalComplexity >= 5) complexityLevel = 'Medium';
        
        const benefits = this.getBenefits();
        const risks = this.getRisks();
        
        return {
            cost: costLevel,
            complexity: complexityLevel,
            benefits: benefits,
            risks: risks
        };
    }

    getBenefits() {
        const benefits = [];
        
        if (this.selectedComponents.includes('hl7-fhir')) {
            benefits.push('Modern web-friendly integration');
        }
        if (this.selectedComponents.includes('rxnorm')) {
            benefits.push('Standardized drug terminology');
        }
        if (this.selectedComponents.includes('ihe-profiles')) {
            benefits.push('Proven implementation patterns');
        }
        
        return benefits.length > 0 ? benefits.join(', ') : 'Limited benefits with current selection';
    }

    getRisks() {
        const risks = [];
        
        if (this.selectedComponents.includes('snomed-ct') && !this.selectedComponents.includes('rxnorm')) {
            risks.push('Complex terminology without drug standardization');
        }
        if (this.selectedComponents.includes('hl7-v2') && this.selectedComponents.includes('hl7-fhir')) {
            risks.push('Mixed messaging standards may cause confusion');
        }
        if (this.selectedComponents.length === 0) {
            risks.push('No standards selected - solution will not work');
        }
        
        return risks.length > 0 ? risks.join(', ') : 'Minimal risks with current selection';
    }

    evaluateSolution() {
        const analysis = this.analyzeSolution();
        const score = this.calculateScore();
        
        let feedback = '';
        let points = 0;
        
        if (this.selectedComponents.length === 0) {
            feedback = 'You must select at least one standard to create a viable solution.';
        } else if (this.selectedComponents.includes('rxnorm') && this.selectedComponents.includes('hl7-fhir')) {
            feedback = 'Excellent! You\'ve selected the optimal combination of FHIR for modern integration and RxNorm for drug standardization.';
            points = 50;
        } else if (this.selectedComponents.includes('rxnorm')) {
            feedback = 'Good choice with RxNorm for drug terminology. Consider adding FHIR for better integration.';
            points = 30;
        } else if (this.selectedComponents.includes('hl7-fhir')) {
            feedback = 'FHIR is a great choice for modern integration. Consider adding RxNorm for drug standardization.';
            points = 25;
        } else {
            feedback = 'Your solution has merit but could be improved with modern standards like FHIR and RxNorm.';
            points = 15;
        }
        
        this.studentProgress.totalPoints += points;
        this.studentProgress.saveProgress();
        
        // Show solution evaluation in modal
        if (window.modalManager) {
            const content = `
                <div class="modal-description">${feedback}</div>
                <div class="modal-stats">
                    <div class="modal-stat">
                        <div class="modal-stat-value">${score}/100</div>
                        <div class="modal-stat-label">Score</div>
                    </div>
                    <div class="modal-stat">
                        <div class="modal-stat-value">${points}</div>
                        <div class="modal-stat-label">Points Awarded</div>
                    </div>
                </div>
            `;
            window.modalManager.show('Solution Evaluation', content, true, 'Continue');
        } else {
            alert(`Solution Evaluation:\n\n${feedback}\n\nScore: ${score}/100\nPoints Awarded: ${points}`);
        }
        
        // Check if master challenge is complete
        if (points >= 30) {
            document.getElementById('completeMaster').style.display = 'block';
        }
    }

    calculateScore() {
        let score = 0;
        
        // Base score for having components
        score += Math.min(this.selectedComponents.length * 10, 40);
        
        // Bonus for optimal combinations
        if (this.selectedComponents.includes('rxnorm') && this.selectedComponents.includes('hl7-fhir')) {
            score += 30;
        }
        if (this.selectedComponents.includes('ihe-profiles')) {
            score += 10;
        }
        if (this.selectedComponents.includes('loinc')) {
            score += 10;
        }
        
        // Penalty for poor combinations
        if (this.selectedComponents.includes('hl7-v2') && this.selectedComponents.includes('hl7-fhir')) {
            score -= 10;
        }
        if (this.selectedComponents.includes('snomed-ct') && !this.selectedComponents.includes('rxnorm')) {
            score -= 5;
        }
        
        return Math.max(0, Math.min(100, score));
    }
}

// Global instances
let clinicalScenarios;
let masterChallenge;

// Initialize modules
function initModules(studentProgress, achievementManager) {
    window.clinicalScenarios = new ClinicalScenariosModule(studentProgress, achievementManager);
    window.masterChallenge = new MasterChallengeModule(studentProgress, achievementManager);
}

// Export for module use
export {
    ClinicalScenariosModule,
    MasterChallengeModule,
    initModules
};

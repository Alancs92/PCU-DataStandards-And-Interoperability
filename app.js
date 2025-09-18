// Import scenarios module
import { ClinicalScenariosModule, MasterChallengeModule, initModules } from './scenarios.js';

// Student Progress Data Structure
class StudentProgress {
    constructor() {
        this.moduleCompletion = [false, false, false, false, false];
        this.totalPoints = 0;
        this.achievements = [];
        this.timeSpent = 0;
        this.scenariosCompleted = [];
        this.assessmentScores = [];
        this.quizAnswers = {
            foundation: [],
            standards: [],
            interoperability: [],
            scenarios: [],
            master: []
        };
    }

    // Load progress from localStorage
    loadProgress() {
        try {
            const saved = localStorage.getItem('healthDataProgress');
            if (saved) {
                const savedData = JSON.parse(saved);
                Object.assign(this, savedData);
            }
        } catch (error) {
            console.log('No saved progress found, starting fresh');
        }
    }

    // Save progress to localStorage
    saveProgress() {
        try {
            localStorage.setItem('healthDataProgress', JSON.stringify(this));
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }
}

// Quiz Management System
class QuizManager {
    constructor(studentProgress) {
        this.studentProgress = studentProgress;
        this.correctAnswers = {
            'foundation-content': {
                'Question 1': 'semantic',
                'Question 2': 'rules',
                'Question 3': 'false'
            },
            'standards-content': {
                'Question 1': 'hl7v2',
                'Question 2': 'web-friendly',
                'Question 3': 'snomed'
            },
                'interoperability-content': {
                    'Question 1': 'semantic',
                    'Question 2': 'level3',
                    'Question 3': 'all'
                },
                'scenarios-content': {
                    'Question 1': 'full-interop',
                    'Question 2': 'standardization',
                    'Question 3': 'both'
                },
                'master-content': {
                    'Question 1': 'fhir-rxnorm',
                    'Question 2': 'all-factors',
                    'Question 3': 'level3'
                }
        };
        this.feedbackTexts = {
            'foundation-content': {
                'Question 1': {
                    correct: 'Semantic interoperability is missing because the systems can exchange and parse the data structure, but they don\'t share the same understanding of what the lab codes mean.',
                    incorrect: 'The correct answer is Semantic Interoperability. The systems can exchange data (technical) and parse the structure (syntactic), but lack shared meaning (semantic).'
                },
                'Question 2': {
                    correct: 'Standards are indeed agreed-upon rules for how data should be structured, formatted, and communicated between systems.',
                    incorrect: 'The correct answer is "Agreed-upon rules for data structure and format." Standards define the technical specifications, not capabilities or workflows.'
                },
                'Question 3': {
                    correct: 'Correct! Using the same standard doesn\'t guarantee interoperability due to local variations, different implementations, and missing semantic understanding.',
                    incorrect: 'The correct answer is False. Even systems using the same standard may have local variations, different implementations, or lack semantic interoperability.'
                }
            },
            'standards-content': {
                'Question 1': {
                    correct: 'HL7 v2 is the most appropriate standard for exchanging laboratory results between systems. It\'s specifically designed for this type of messaging.',
                    incorrect: 'The correct answer is HL7 v2. While DICOM is for imaging, SNOMED-CT and LOINC are terminology standards, HL7 v2 is the messaging standard for lab results.'
                },
                'Question 2': {
                    correct: 'FHIR\'s main advantage is being web-friendly and mobile-ready, using modern web technologies like REST APIs and JSON.',
                    incorrect: 'The correct answer is "Web-friendly and mobile-ready." FHIR uses modern web technologies, while HL7 v2 is older and more complex.'
                },
                'Question 3': {
                    correct: 'SNOMED-CT contains over 350,000 clinical concepts, making it the most comprehensive clinical terminology standard.',
                    incorrect: 'The correct answer is SNOMED-CT. While LOINC has 98,000+ terms and ICD-10 has many codes, SNOMED-CT has the most clinical concepts.'
                }
            },
            'interoperability-content': {
                'Question 1': {
                    correct: 'Semantic interoperability is lacking because the systems can exchange the data (technical) and parse the structure (syntactic), but they don\'t share the same understanding of what the units mean.',
                    incorrect: 'The correct answer is Semantic Interoperability. The systems can exchange data and parse structure, but lack shared understanding of units (mEq/L vs mmol/L).'
                },
                'Question 2': {
                    correct: 'Level 3 - Semantic interoperability enables automated clinical decision support because systems share understanding of data meaning.',
                    incorrect: 'The correct answer is Level 3 - Semantic. Only when systems understand data meaning can they provide automated clinical decision support.'
                },
                'Question 3': {
                    correct: 'All of the above are correct. Level 3 interoperability requires terminology services infrastructure, significant training, and higher costs compared to Level 2.',
                    incorrect: 'The correct answer is "All of the above." Level 3 interoperability requires terminology services, training, and costs that small clinics may struggle with.'
                }
            },
            'scenarios-content': {
                'Question 1': {
                    correct: 'With Full Interoperability provides the best patient outcomes through seamless data exchange and automated decision support.',
                    incorrect: 'The correct answer is "With Full Interoperability." This approach enables optimal patient care with minimal delays and risks.'
                },
                'Question 2': {
                    correct: 'RxNorm provides standardized drug terminology, enabling accurate medication reconciliation across different systems.',
                    incorrect: 'The correct answer is "Provides standardized drug terminology." RxNorm ensures consistent drug identification across systems.'
                },
                'Question 3': {
                    correct: 'Both cost and clinical benefits should be considered when implementing interoperability solutions to ensure optimal outcomes.',
                    incorrect: 'The correct answer is "Both cost and clinical benefits." Successful implementations balance financial considerations with patient care improvements.'
                }
            },
            'master-content': {
                'Question 1': {
                    correct: 'FHIR + RxNorm provides the optimal combination of modern integration capabilities and standardized drug terminology.',
                    incorrect: 'The correct answer is "FHIR + RxNorm." This combination offers modern web-friendly integration with standardized drug terminology.'
                },
                'Question 2': {
                    correct: 'All factors - implementation complexity, cost, and standards compliance - must be considered for successful interoperability projects.',
                    incorrect: 'The correct answer is "All of the above." Small clinics must balance complexity, cost, and compliance requirements.'
                },
                'Question 3': {
                    correct: 'Level 3 - Semantic interoperability is required for automated drug interaction checking because systems need to understand drug meanings.',
                    incorrect: 'The correct answer is "Level 3 - Semantic." Automated drug interaction checking requires shared understanding of drug meanings.'
                }
            }
        };
    }

    setupQuizListeners() {
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', (event) => {
                if (event.target.classList.contains('selected')) return;
                
                // Remove previous selections in this question
                const question = event.target.closest('.quiz-question');
                question.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                event.target.classList.add('selected');
                
                // Add visual feedback
                event.target.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    event.target.style.transform = 'scale(1)';
                }, 200);
                
                // Check answer after a short delay
                setTimeout(() => {
                    this.checkAnswer(event.target, question);
                }, 500);
            });
        });
    }

    checkAnswer(selectedOption, question) {
        // Get question text to identify which question this is
        const questionText = question.querySelector('p').textContent;
        let questionId = 'Question 1'; // default
        
        if (questionText.includes('Question 1:')) {
            questionId = 'Question 1';
        } else if (questionText.includes('Question 2:')) {
            questionId = 'Question 2';
        } else if (questionText.includes('Question 3:')) {
            questionId = 'Question 3';
        }
        
        const answer = selectedOption.dataset.answer;
        
        // Determine which module this question belongs to
        const moduleContent = question.closest('.module-content');
        const moduleId = moduleContent ? moduleContent.id : 'foundation-content';
        
        const moduleAnswers = this.correctAnswers[moduleId] || this.correctAnswers['foundation-content'];
        const isCorrect = moduleAnswers[questionId] === answer;
        
        // Visual feedback
        selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Show feedback
        const feedback = question.querySelector('.feedback');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
            
            if (isCorrect) {
                feedback.innerHTML = '<strong>Correct!</strong> ' + this.getFeedbackText(questionId, true, moduleId);
                this.studentProgress.totalPoints += 10;
            } else {
                feedback.innerHTML = '<strong>Incorrect.</strong> ' + this.getFeedbackText(questionId, false, moduleId);
            }
        }
        
        // Store answer in appropriate module
        const moduleName = moduleId.replace('-content', '');
        if (!this.studentProgress.quizAnswers[moduleName]) {
            this.studentProgress.quizAnswers[moduleName] = [];
        }
        this.studentProgress.quizAnswers[moduleName].push({
            question: questionId,
            answer: answer,
            correct: isCorrect
        });
        
        this.studentProgress.saveProgress();
        
        // Check module completion
        this.checkModuleCompletion(moduleId);
    }

    getFeedbackText(questionId, isCorrect, moduleId = 'foundation-content') {
        const moduleTexts = this.feedbackTexts[moduleId] || this.feedbackTexts['foundation-content'];
        return moduleTexts[questionId][isCorrect ? 'correct' : 'incorrect'];
    }

    checkModuleCompletion(moduleId) {
        console.log(`Checking completion for module: ${moduleId}`);
        
        const moduleCompletionMap = {
            'foundation-content': 'checkFoundationCompletion',
            'standards-content': 'checkStandardsCompletion',
            'interoperability-content': 'checkInteroperabilityCompletion',
            'scenarios-content': 'checkScenariosCompletion',
            'master-content': 'checkMasterCompletion'
        };

        const completionFunction = moduleCompletionMap[moduleId];
        if (completionFunction && window[completionFunction]) {
            console.log(`Calling ${completionFunction}`);
            window[completionFunction]();
        } else {
            console.log(`Completion function not found for ${moduleId}`);
        }
    }
}

// Achievement System
class AchievementManager {
    constructor(studentProgress) {
        this.studentProgress = studentProgress;
        this.allAchievements = [
            { id: 'Standards Scholar', icon: '📚', description: 'Master all standard definitions', points: 100 },
            { id: 'Interoperability Expert', icon: '🔗', description: 'Complete all four levels scenarios', points: 150 },
            { id: 'Clinical Connector', icon: '🏥', description: 'Solve 3 clinical scenarios correctly', points: 200 },
            { id: 'Diagnostic Detective', icon: '🔍', description: 'Identify all common misconceptions', points: 100 },
            { id: 'FHIR Master', icon: '⚡', description: 'Complete FHIR-specific challenges', points: 150 },
            { id: 'Integration Specialist', icon: '🎯', description: 'Design complete interoperability solution', points: 300 }
        ];
    }

    showAchievement(title, icon, description) {
        const panel = document.getElementById('achievementPanel');
        const list = document.getElementById('achievementsList');
        
        // Create achievement element
        const achievement = document.createElement('div');
        achievement.className = 'achievement-badge achievement-earned pulse';
        achievement.innerHTML = `
            <div class="achievement-icon">${icon}</div>
            <div>
                <div style="font-weight: bold;">${title}</div>
                <div style="font-size: 0.8rem;">${description}</div>
            </div>
        `;
        
        list.appendChild(achievement);
        
        // Show panel
        panel.classList.add('show');
        
        // Hide after 5 seconds
        setTimeout(() => {
            panel.classList.remove('show');
        }, 5000);
    }

    updateAchievements() {
        const list = document.getElementById('achievementsList');
        list.innerHTML = '';
        
        this.allAchievements.forEach(achievement => {
            const earned = this.studentProgress.achievements.includes(achievement.id);
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${earned ? 'achievement-earned' : ''}`;
            badge.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div>
                    <div style="font-weight: bold;">${achievement.id}</div>
                    <div style="font-size: 0.8rem;">${achievement.description}</div>
                    <div style="font-size: 0.7rem; color: #666;">${achievement.points} points</div>
                </div>
            `;
            list.appendChild(badge);
        });
    }
}

// Module Management System
class ModuleManager {
    constructor(studentProgress, achievementManager) {
        this.studentProgress = studentProgress;
        this.achievementManager = achievementManager;
    }

    updateUI() {
        // Update overall progress bar
        const completedModules = this.studentProgress.moduleCompletion.filter(Boolean).length;
        const totalModules = this.studentProgress.moduleCompletion.length;
        const progressPercentage = (completedModules / totalModules) * 100;
        
        document.getElementById('overallProgress').style.width = progressPercentage + '%';
        document.getElementById('progressText').textContent = Math.round(progressPercentage) + '% Complete';

        // Update module cards
        const modules = ['foundation', 'standards', 'interoperability', 'scenarios', 'master'];
        modules.forEach((module, index) => {
            const card = document.querySelector(`[data-module="${module}"]`);
            const progressCircle = document.getElementById(`${module}Progress`);
            
            if (this.studentProgress.moduleCompletion[index]) {
                card.classList.add('completed');
                card.classList.remove('locked');
                progressCircle.textContent = '✓';
                progressCircle.classList.add('completed');
            } else if (index === 0 || this.studentProgress.moduleCompletion[index - 1]) {
                card.classList.add('unlocked');
                card.classList.remove('locked');
                progressCircle.textContent = '0%';
            }
        });

        // Update achievements
        this.achievementManager.updateAchievements();
    }

    setupModuleNavigation() {
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (event) => {
                if (event.currentTarget.classList.contains('locked')) return;
                
                const module = event.currentTarget.dataset.module;
                this.showModule(module);
            });
        });
    }

    showModule(moduleName) {
        // Hide all content
        document.querySelectorAll('.module-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected content
        const content = document.getElementById(`${moduleName}-content`);
        if (content) {
            content.classList.add('active');
            content.classList.add('fade-in');
        }
        
        // Update active module in navigation
        document.querySelectorAll('.module-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');
    }

    unlockModule(moduleName) {
        const card = document.querySelector(`[data-module="${moduleName}"]`);
        const progressCircle = document.getElementById(`${moduleName}Progress`);
        
        card.classList.remove('locked');
        card.classList.add('unlocked');
        progressCircle.textContent = '0%';
    }
}

// Standards Module Functions
class StandardsModule {
    static showTimelineDetail(standard) {
        const details = {
            'dicom': {
                title: 'DICOM (Digital Imaging and Communications in Medicine)',
                description: 'Universal standard for medical imaging. Includes images plus metadata (patient, study, series, instance). Used globally for PACS interoperability.',
                keyPoints: [
                    'Established in 1985, still widely used today',
                    'Handles images + metadata in single package',
                    'Enables PACS interoperability globally',
                    'Challenge: Large file sizes, proprietary extensions'
                ]
            },
            'hl7v2': {
                title: 'HL7 v2.x (Health Level Seven Version 2)',
                description: 'Most widely adopted messaging standard. Used in 95% of US hospitals and 35+ countries. Pipe-delimited format.',
                keyPoints: [
                    'First released in 1987, still actively used',
                    '95% adoption in US hospitals',
                    'Pipe-delimited format: MSH|^~\\&|...',
                    'Limitation: 350+ variations create "v2 dialects"'
                ]
            },
            'cda': {
                title: 'HL7 CDA/C-CDA (Clinical Document Architecture)',
                description: 'Continuity of Care Document standard for transitions. Human-readable + machine-processable. US Meaningful Use requirement.',
                keyPoints: [
                    'Released in 2005, still widely used',
                    'Human-readable + machine-processable',
                    'US Meaningful Use requirement',
                    'Used for care transitions and summaries'
                ]
            },
            'fhir': {
                title: 'HL7 FHIR (Fast Healthcare Interoperability Resources)',
                description: 'Modern web-friendly standard. 71% of countries report FHIR usage as of 2025. Resource-based architecture.',
                keyPoints: [
                    'Launched in 2014, rapidly growing adoption',
                    '71% of countries report FHIR usage',
                    'Web-friendly, mobile-ready, modular',
                    'Resource-based: Patient, Observation, Medication'
                ]
            },
            'icd11': {
                title: 'ICD-11 (International Classification of Diseases)',
                description: 'WHO released digital-native classification system in 2022. Designed for modern digital health systems.',
                keyPoints: [
                    'Released by WHO in 2022',
                    'Digital-native design',
                    'Replaces ICD-10 globally',
                    'Better suited for electronic health records'
                ]
            }
        };
        
        const detail = details[standard];
        if (detail) {
            alert(`${detail.title}\n\n${detail.description}\n\nKey Points:\n${detail.keyPoints.map(point => '• ' + point).join('\n')}`);
        }
    }

    static showStandardDetails(category) {
        const details = {
            'messaging': {
                title: '📨 Messaging Standards',
                description: 'How data is transmitted between systems',
                standards: [
                    'HL7 v2.x: Used in 95% of US hospitals, pipe-delimited format',
                    'HL7 FHIR: Modern web-friendly, resource-based architecture',
                    'HL7 CDA/C-CDA: Document-based, human-readable + machine-processable'
                ]
            },
            'terminology': {
                title: '📚 Terminology Standards',
                description: 'Vocabulary and coding systems',
                standards: [
                    'SNOMED-CT: 350,000+ clinical concepts, used in 40+ countries',
                    'LOINC: 98,000+ terms for lab tests and clinical observations',
                    'ICD-10/ICD-11: Disease classification, global standard',
                    'RxNorm: 20,000+ normalized drug names for US'
                ]
            },
            'imaging': {
                title: '🖼️ Imaging Standards',
                description: 'Medical imaging and metadata',
                standards: [
                    'DICOM: Universal medical imaging standard since 1985',
                    'Images + metadata in single package',
                    'Enables PACS interoperability globally',
                    'Handles large file sizes and complex metadata'
                ]
            },
            'transport': {
                title: '🔒 Transport & Security Standards',
                description: 'Data exchange protocols and security',
                standards: [
                    'IHE Profiles: 170+ implementation guides',
                    'OAuth 2.0/SMART: Authorization for FHIR apps',
                    'HTTPS/TLS: Secure data transmission',
                    'XDS: Cross-enterprise document sharing'
                ]
            }
        };
        
        const detail = details[category];
        if (detail) {
            alert(`${detail.title}\n\n${detail.description}\n\nStandards:\n${detail.standards.map(std => '• ' + std).join('\n')}`);
        }
    }

    static showCodeExample(standard) {
        const examples = {
            'hl7v2': {
                title: 'HL7 v2 Message Example',
                code: `MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.7
EVN||20240101120000
PID|1||123456789^^^MRN^MR||SMITH^JOHN^MIDDLE||19900101|M|||123 MAIN ST^^CITY^ST^12345||555-1234|||S||123456789
PV1|1|I|ICU^001^01||||1234567890^DOCTOR^JANE|||||||||1|||||||||||||||||||||||||20240101120000`,
                explanation: 'Message Breakdown:\n• MSH: Message header with sending/receiving information\n• EVN: Event type (patient admission)\n• PID: Patient identification and demographics\n• PV1: Patient visit information'
            },
            'fhir': {
                title: 'FHIR Patient Resource Example',
                code: `{
  "resourceType": "Patient",
  "id": "example",
  "identifier": [{
    "use": "usual",
    "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]},
    "value": "123456789"
  }],
  "name": [{"family": "Smith", "given": ["John", "Middle"]}],
  "gender": "male",
  "birthDate": "1990-01-01",
  "address": [{"line": ["123 Main St"], "city": "City", "state": "ST", "postalCode": "12345"}]
}`,
                explanation: 'FHIR Resource Breakdown:\n• resourceType: Defines the type of resource\n• id: Unique identifier for this resource instance\n• identifier: Patient identification numbers\n• name: Patient name components\n• gender: Patient gender\n• birthDate: Patient date of birth\n• address: Patient address information'
            },
            'snomed': {
                title: 'SNOMED-CT Code Example',
                code: `Code: 38341003
Display: Hypertensive disorder, systemic arterial
Definition: A disorder characterized by a pathological increase in blood pressure

Hierarchy:
• 38341003 - Hypertensive disorder, systemic arterial
  • 195080001 - Essential hypertension
  • 266228000 - Secondary hypertension
    • 194774006 - Hypertension due to renal disease`,
                explanation: 'SNOMED-CT Breakdown:\n• Code: Unique numeric identifier\n• Display: Human-readable term\n• Definition: Clinical definition\n• Hierarchy: Parent-child relationships enable clinical inference'
            },
            'loinc': {
                title: 'LOINC Code Example',
                code: `Code: 718-7
Display: Hemoglobin [Mass/volume] in Blood
Component: Hemoglobin
Property: Mass/volume
Time: Point in time
System: Blood
Scale: Quantitative
Method: Any method`,
                explanation: 'LOINC Breakdown:\n• Code: Unique identifier\n• Display: Full test name\n• Component: What is being measured\n• Property: How it is measured\n• Time: When it is measured\n• System: Where it is measured\n• Scale: Type of result\n• Method: How it is measured'
            }
        };
        
        const example = examples[standard];
        if (example) {
            const codeExample = document.getElementById('codeExample');
            codeExample.innerHTML = `
                <h4>${example.title}</h4>
                <pre><code>${example.code}</code></pre>
                <div class="code-explanation">
                    <h5>${example.explanation.split('\n')[0]}</h5>
                    <ul>
                        ${example.explanation.split('\n').slice(1).map(line => `<li>${line.replace('• ', '')}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            // Update active button
            document.querySelectorAll('.code-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }
    }
}

// Module Completion Functions
function checkFoundationCompletion() {
    const foundationQuizzes = document.querySelectorAll('#foundation-content .quiz-question');
    let answeredCount = 0;
    
    foundationQuizzes.forEach(quiz => {
        const selectedOption = quiz.querySelector('.quiz-option.selected');
        if (selectedOption) {
            answeredCount++;
        }
    });
    
    console.log(`Foundation: ${answeredCount}/${foundationQuizzes.length} questions answered`);
    
    if (answeredCount >= foundationQuizzes.length) {
        const completeButton = document.getElementById('completeFoundation');
        if (completeButton) {
            completeButton.style.display = 'block';
            console.log('Foundation completion button shown');
        }
    }
}

function checkStandardsCompletion() {
    const standardsQuizzes = document.querySelectorAll('#standards-content .quiz-question');
    let answeredCount = 0;
    
    standardsQuizzes.forEach(quiz => {
        const selectedOption = quiz.querySelector('.quiz-option.selected');
        if (selectedOption) {
            answeredCount++;
        }
    });
    
    console.log(`Standards: ${answeredCount}/${standardsQuizzes.length} questions answered`);
    
    if (answeredCount >= standardsQuizzes.length) {
        const completeButton = document.getElementById('completeStandards');
        if (completeButton) {
            completeButton.style.display = 'block';
            console.log('Standards completion button shown');
        }
    }
}

function checkInteroperabilityCompletion() {
    const interopQuizzes = document.querySelectorAll('#interoperability-content .quiz-question');
    let answeredCount = 0;
    
    interopQuizzes.forEach(quiz => {
        const selectedOption = quiz.querySelector('.quiz-option.selected');
        if (selectedOption) {
            answeredCount++;
        }
    });
    
    if (answeredCount >= interopQuizzes.length) {
        document.getElementById('completeInteroperability').style.display = 'block';
    }
}

function checkScenariosCompletion() {
    const scenariosQuizzes = document.querySelectorAll('#scenarios-content .quiz-question');
    let answeredCount = 0;
    
    scenariosQuizzes.forEach(quiz => {
        const selectedOption = quiz.querySelector('.quiz-option.selected');
        if (selectedOption) {
            answeredCount++;
        }
    });
    
    if (answeredCount >= scenariosQuizzes.length) {
        document.getElementById('completeScenarios').style.display = 'block';
    }
}

function checkMasterCompletion() {
    const masterQuizzes = document.querySelectorAll('#master-content .quiz-question');
    let answeredCount = 0;
    
    masterQuizzes.forEach(quiz => {
        const selectedOption = quiz.querySelector('.quiz-option.selected');
        if (selectedOption) {
            answeredCount++;
        }
    });
    
    if (answeredCount >= masterQuizzes.length) {
        document.getElementById('completeMaster').style.display = 'block';
    }
}

// Module Completion Functions
function completeFoundation() {
    studentProgress.moduleCompletion[0] = true;
    studentProgress.totalPoints += 100;
    
    // Award achievement
    if (!studentProgress.achievements.includes('Standards Scholar')) {
        studentProgress.achievements.push('Standards Scholar');
        achievementManager.showAchievement('Standards Scholar', '📚', 'Mastered all standard definitions');
    }
    
    studentProgress.saveProgress();
    moduleManager.updateUI();
    
    // Unlock next module
    moduleManager.unlockModule('standards');
    
    // Show completion message
    alert('🎉 Foundation module completed! Standards Deep Dive module is now unlocked.');
}

function completeStandards() {
    studentProgress.moduleCompletion[1] = true;
    studentProgress.totalPoints += 150;
    
    // Award achievement
    if (!studentProgress.achievements.includes('FHIR Master')) {
        studentProgress.achievements.push('FHIR Master');
        achievementManager.showAchievement('FHIR Master', '⚡', 'Completed FHIR-specific challenges');
    }
    
    studentProgress.saveProgress();
    moduleManager.updateUI();
    
    // Unlock next module
    moduleManager.unlockModule('interoperability');
    
    // Show completion message
    alert('🎉 Standards Deep Dive module completed! Interoperability Levels module is now unlocked.');
}

function completeInteroperability() {
    studentProgress.moduleCompletion[2] = true;
    studentProgress.totalPoints += 200;
    
    // Award achievement
    if (!studentProgress.achievements.includes('Interoperability Expert')) {
        studentProgress.achievements.push('Interoperability Expert');
        achievementManager.showAchievement('Interoperability Expert', '🔗', 'Completed all four levels scenarios');
    }
    
    studentProgress.saveProgress();
    moduleManager.updateUI();
    
    // Unlock next module
    moduleManager.unlockModule('scenarios');
    
    // Show completion message
    alert('🎉 Interoperability Levels module completed! Clinical Scenarios module is now unlocked.');
}

function completeScenarios() {
    studentProgress.moduleCompletion[3] = true;
    studentProgress.totalPoints += 250;
    
    // Award achievement
    if (!studentProgress.achievements.includes('Clinical Connector')) {
        studentProgress.achievements.push('Clinical Connector');
        achievementManager.showAchievement('Clinical Connector', '🏥', 'Solved 3 clinical scenarios correctly');
    }
    
    studentProgress.saveProgress();
    moduleManager.updateUI();
    
    // Unlock next module
    moduleManager.unlockModule('master');
    
    // Show completion message
    alert('🎉 Clinical Scenarios module completed! Master Challenge module is now unlocked.');
}

function completeMaster() {
    studentProgress.moduleCompletion[4] = true;
    studentProgress.totalPoints += 300;
    
    // Award achievement
    if (!studentProgress.achievements.includes('Integration Specialist')) {
        studentProgress.achievements.push('Integration Specialist');
        achievementManager.showAchievement('Integration Specialist', '🎯', 'Designed complete interoperability solution');
    }
    
    studentProgress.saveProgress();
    moduleManager.updateUI();
    
    // Show completion message
    alert('🎉 Master Challenge completed! Congratulations on completing the entire Health Data Standards & Interoperability course!');
}

// Utility Functions
function revealAnswer(elementId) {
    const answer = document.getElementById(elementId + '-answer');
    if (answer) {
        answer.style.display = 'block';
        answer.classList.add('fade-in');
    }
}

// Global variables
let studentProgress;
let quizManager;
let achievementManager;
let moduleManager;
let clinicalScenarios;
let masterChallenge;

// Make functions globally accessible for HTML onclick handlers
window.revealAnswer = revealAnswer;
window.StandardsModule = StandardsModule;
window.clinicalScenarios = null;
window.masterChallenge = null;

// Make completion functions globally accessible
window.checkFoundationCompletion = checkFoundationCompletion;
window.checkStandardsCompletion = checkStandardsCompletion;
window.checkInteroperabilityCompletion = checkInteroperabilityCompletion;
window.checkScenariosCompletion = checkScenariosCompletion;
window.checkMasterCompletion = checkMasterCompletion;

// Initialize the application
function init() {
    // Initialize core systems
    studentProgress = new StudentProgress();
    studentProgress.loadProgress();
    
    achievementManager = new AchievementManager(studentProgress);
    moduleManager = new ModuleManager(studentProgress, achievementManager);
    quizManager = new QuizManager(studentProgress);
    
    // Initialize scenario modules
    window.clinicalScenarios = new ClinicalScenariosModule(studentProgress, achievementManager);
    window.masterChallenge = new MasterChallengeModule(studentProgress, achievementManager);
    
    // Setup event listeners
    quizManager.setupQuizListeners();
    moduleManager.setupModuleNavigation();
    
    // Set up complete module buttons
    document.getElementById('completeFoundation').addEventListener('click', completeFoundation);
    document.getElementById('completeStandards').addEventListener('click', completeStandards);
    document.getElementById('completeInteroperability').addEventListener('click', completeInteroperability);
    document.getElementById('completeScenarios').addEventListener('click', completeScenarios);
    document.getElementById('completeMaster').addEventListener('click', completeMaster);
    
    // Start time tracking
    const startTime = Date.now();
    setInterval(() => {
        studentProgress.timeSpent = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
    
    // Initial UI update
    moduleManager.updateUI();
    
    // Add manual completion check for debugging
    window.checkAllCompletions = function() {
        console.log('Checking all module completions...');
        checkFoundationCompletion();
        checkStandardsCompletion();
        checkInteroperabilityCompletion();
        checkScenariosCompletion();
        checkMasterCompletion();
    };
    
    // Check completions after a short delay to ensure DOM is ready
    setTimeout(() => {
        window.checkAllCompletions();
    }, 1000);
}

// Export for module use
export {
    StudentProgress,
    QuizManager,
    AchievementManager,
    ModuleManager,
    StandardsModule,
    init
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

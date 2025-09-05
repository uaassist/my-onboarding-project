document.addEventListener('DOMContentLoaded', () => {
    // State management object to hold user data
    const userData = {
        name: '',
        email: '',
        businessName: '',
        googlePlaceId: '',
        mapsUrl: ''
    };

    let currentStep = 1;
    const allSteps = document.querySelectorAll('.step-box');

    // --- Element Selectors ---
    const stepElements = {
        step1: document.getElementById('step1Box'),
        name: document.getElementById('nameBox'),
        email: document.getElementById('emailBox'),
        businessSearch: document.getElementById('businessSearchBox'),
        results: document.getElementById('resultsBox'),
        manualEntry: document.getElementById('manualEntryBox'),
        confirmation: document.getElementById('confirmationBox'),
        thankYou: document.getElementById('thankYouBox')
    };

    // --- Helper Functions ---

    /**
     * Simulates a typewriter effect for a given text element.
     * @param {HTMLElement} element - The text element to apply the effect to.
     * @param {string} text - The text to type out.
     * @param {function} [callback] - Optional callback to run when typing is complete.
     */
    function typewriter(element, text, callback) {
        let i = 0;
        element.innerHTML = '';
        
        // Find the avatar and add the .speaking class to start the animation
        const avatar = document.getElementById('avatarImage');
        if (avatar) {
            avatar.classList.add('speaking');
        }

        const typing = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);

                // Typing is done, so remove the .speaking class to stop the animation
                if (avatar) {
                    avatar.classList.remove('speaking');
                }

                if (callback) callback();
            }
        }, 50); // Typing speed in ms
    }

    /**
     * Manages transitions between steps.
     * @param {number} stepNumber - The step to show.
     */
    function showStep(stepNumber) {
        allSteps.forEach(step => step.classList.remove('active'));
        const stepId = Object.keys(stepElements)[stepNumber - 1];
        if (stepElements[stepId]) {
            stepElements[stepId].classList.add('active');
            currentStep = stepNumber;
        }
    }

    // --- Validation Functions ---

    function validateName() {
        const input = document.getElementById('nameInput');
        const error = document.getElementById('nameError');
        const nextBtn = document.getElementById('nextStep2');
        if (input.value.trim().length > 1) {
            error.style.display = 'none';
            nextBtn.disabled = false;
            return true;
        } else {
            error.textContent = "Please enter your full name.";
            error.style.display = 'block';
            nextBtn.disabled = true;
            return false;
        }
    }

    function validateEmail() {
        const input = document.getElementById('emailInput');
        const error = document.getElementById('emailError');
        const nextBtn = document.getElementById('nextStep3');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(input.value)) {
            error.style.display = 'none';
            nextBtn.disabled = false;
            return true;
        } else {
            error.textContent = "Alex thinks: 'This doesn't look like a valid email!'";
            error.style.display = 'block';
            nextBtn.disabled = true;
            return false;
        }
    }
    
    function validateBusinessSearch() {
        const input = document.getElementById('businessSearchInput');
        const findBtn = document.getElementById('findBusinessBtn');
        findBtn.disabled = input.value.trim().length < 3;
    }
    
    function validateMapsUrl() {
        const input = document.getElementById('mapsUrlInput');
        const error = document.getElementById('manualEntryError');
        const nextBtn = document.getElementById('nextStepManual');
        // Simple regex to check for google.com/maps URL
        const urlRegex = /^https?:\/\/(www\.)?google\.com\/maps\//;
        if (urlRegex.test(input.value)) {
            error.style.display = 'none';
            nextBtn.disabled = false;
            return true;
        } else {
            error.textContent = "Please paste a valid Google Maps URL.";
            error.style.display = 'block';
            nextBtn.disabled = true;
            return false;
        }
    }

    // --- Event Listeners Setup ---

    // Input validation listeners
    document.getElementById('nameInput').addEventListener('input', validateName);
    document.getElementById('emailInput').addEventListener('input', validateEmail);
    document.getElementById('businessSearchInput').addEventListener('input', validateBusinessSearch);
    document.getElementById('mapsUrlInput').addEventListener('input', validateMapsUrl);

    // Navigation button listeners
    document.getElementById('nextStep1').addEventListener('click', () => {
        typewriter(document.getElementById('namePrompt'), "Let's start with your name. What should I call you?", () => {
            document.getElementById('nameInput').focus();
        });
        showStep(2);
    });

    document.getElementById('nextStep2').addEventListener('click', () => {
        if (validateName()) {
            userData.name = document.getElementById('nameInput').value.trim();
            const prompt = `Great to meet you, ${userData.name.split(' ')[0]}! What's the best email to reach you?`;
            typewriter(document.getElementById('emailPrompt'), prompt, () => {
                 document.getElementById('emailInput').focus();
            });
            showStep(3);
        }
    });

    document.getElementById('nextStep3').addEventListener('click', () => {
        if (validateEmail()) {
            userData.email = document.getElementById('emailInput').value.trim();
            typewriter(document.getElementById('businessPrompt'), "Perfect. Now, what is the name of your business? Please include the city for best results.", () => {
                document.getElementById('businessSearchInput').focus();
            });
            showStep(4);
        }
    });

    // Back buttons
    document.getElementById('backToStep1').addEventListener('click', () => showStep(1));
    document.getElementById('backToStep2').addEventListener('click', () => showStep(2));
    document.getElementById('backToStep3').addEventListener('click', () => showStep(3));
    document.getElementById('backToSearch').addEventListener('click', () => showStep(4));
    document.getElementById('backToResults').addEventListener('click', () => showStep(5));
    document.getElementById('backToPrevious').addEventListener('click', () => {
        // Go back to search results or manual entry depending on what was filled
        if(userData.mapsUrl) {
            showStep(6);
        } else {
            showStep(5);
        }
    });

    // Business search logic
    document.getElementById('findBusinessBtn').addEventListener('click', async () => {
        const query = document.getElementById('businessSearchInput').value.trim();
        const loadingState = document.getElementById('loadingState');
        const findBtn = document.getElementById('findBusinessBtn');
        const businessError = document.getElementById('businessError');
        
        businessError.style.display = 'none'; // Hide previous errors
        loadingState.classList.remove('hidden');
        findBtn.disabled = true;

        try {
            // This is the fetch call to our secure Netlify Function
            const response = await fetch(`/.netlify/functions/get-places?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const places = await response.json();
            displayResults(places);
            showStep(5);

        } catch (error) {
            console.error('Error fetching places:', error);
            businessError.textContent = "Sorry, we couldn't fetch results. Please try again.";
            businessError.style.display = 'block';
        } finally {
            loadingState.classList.add('hidden');
            findBtn.disabled = false;
        }
    });

    function displayResults(places) {
        const repeater = document.getElementById('resultsRepeater');
        repeater.innerHTML = ''; // Clear previous results
        if (!places || places.length === 0) {
            repeater.innerHTML = '<p style="padding: 15px; text-align: center; color: var(--text-light);">No results found. You can enter your business manually below.</p>';
            return;
        }

        places.forEach(place => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-info">
                    <h4>${place.name}</h4>
                    <p>${place.address}</p>
                </div>
                <button class="button primary">Select</button>
            `;
            item.querySelector('button').addEventListener('click', () => {
                userData.businessName = place.name;
                userData.googlePlaceId = place.placeId;
                userData.mapsUrl = ''; // Clear manual URL if it exists
                prepareConfirmation();
            });
            repeater.appendChild(item);
        });
    }
    
    document.getElementById('manualEntryBtn').addEventListener('click', () => showStep(6));
    
    document.getElementById('nextStepManual').addEventListener('click', () => {
        if (validateMapsUrl()) {
            userData.mapsUrl = document.getElementById('mapsUrlInput').value.trim();
            userData.businessName = "Manually Entered via URL"; // Set a placeholder
            userData.googlePlaceId = ''; // Clear place ID
            prepareConfirmation();
        }
    });
    
    function prepareConfirmation() {
        // Populate the summary card
        document.getElementById('confirmName').textContent = userData.name;
        document.getElementById('confirmEmail').textContent = userData.email;
        document.getElementById('confirmBusiness').textContent = userData.businessName;

        // Populate the hidden form fields for Netlify
        document.getElementById('formName').value = userData.name;
        document.getElementById('formEmail').value = userData.email;
        document.getElementById('formBusinessName').value = userData.businessName;
        document.getElementById('formGooglePlaceId').value = userData.googlePlaceId;
        document.getElementById('formMapsUrl').value = userData.mapsUrl;

        showStep(7);
    }

    // --- Initializer ---
    function initialize() {
        // Special handling for when user is redirected back to the form after submission
        if (window.location.search.includes('submitted=true')) {
            showStep(8);
        } else {
            // Start the normal onboarding process from step 1
            showStep(1); 
            typewriter(
                document.getElementById('welcomeText'), 
                "Hello! I'm Alex, your personal onboarding specialist. I'll help get your free trial set up in just a few moments.",
                () => { document.getElementById('nextStep1').disabled = false; }
            );
        }
    }

    initialize();
});

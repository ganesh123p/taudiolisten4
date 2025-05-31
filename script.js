document.addEventListener('DOMContentLoaded', () => {
    const teluguText = document.getElementById('teluguText');
    const voiceSelect = document.getElementById('voiceSelect');
    const rate = document.getElementById('rate');
    const rateValue = document.getElementById('rateValue');
    const pitch = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitchValue');
    const speakButton = document.getElementById('speakButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const stopButton = document.getElementById('stopButton');
    const statusMessage = document.getElementById('statusMessage');
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    let synth = window.speechSynthesis;
    let voices = [];
    let currentUtterance = null;
    let isPaused = false;

    function updateStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message'; // Reset classes
        if (type === 'error') {
            statusMessage.classList.add('error'); // You can style this class in CSS
        } else if (type === 'success') {
            statusMessage.classList.add('success');
        }
    }

    function populateVoiceList() {
        if (!synth) {
            updateStatus("క్షమించండి, మీ బ్రౌజర్ టెక్స్ట్-టు-స్పీచ్‌కు మద్దతు ఇవ్వదు.", "error");
            [speakButton, pauseButton, resumeButton, stopButton, rate, pitch, voiceSelect].forEach(el => el.disabled = true);
            return;
        }

        voices = synth.getVoices().filter(voice => voice.lang.startsWith('te')); // Filter for Telugu
        voiceSelect.innerHTML = ''; // Clear previous

        if (voices.length > 0) {
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.setAttribute('data-lang', voice.lang);
                option.setAttribute('data-name', voice.name);
                voiceSelect.appendChild(option);
            });
            voiceSelect.disabled = false;
            updateStatus("వాయిస్‌లు లోడ్ చేయబడ్డాయి. దయచేసి ఒక వాయిస్‌ని ఎంచుకోండి.");
        } else {
            voiceSelect.innerHTML = '<option value="">తెలుగు వాయిస్‌లు లేవు</option>';
            voiceSelect.disabled = true;
            updateStatus("మీ బ్రౌజర్‌లో ప్రత్యేక తెలుగు వాయిస్‌లు కనుగొనబడలేదు. డిఫాల్ట్ వాయిస్ ఉపయోగించబడుతుంది.", "warning");
        }
        speakButton.disabled = false;
    }

    // Voices might load asynchronously
    if (synth && synth.getVoices().length !== 0) {
        populateVoiceList();
    } else if (synth) {
        synth.onvoiceschanged = populateVoiceList;
    } else {
        populateVoiceList(); // Will show the no-support message
    }


    function updateButtonStates(isSpeaking, isCurrentlyPaused) {
        speakButton.disabled = isSpeaking && !isCurrentlyPaused;
        pauseButton.disabled = !isSpeaking || isCurrentlyPaused;
        resumeButton.disabled = !isSpeaking || !isCurrentlyPaused;
        stopButton.disabled = !isSpeaking;
    }
    updateButtonStates(false, false); // Initial state


    rate.addEventListener('input', () => rateValue.textContent = rate.value);
    pitch.addEventListener('input', () => pitchValue.textContent = pitch.value);

    speakButton.addEventListener('click', () => {
        const text = teluguText.value.trim();
        if (text === '') {
            updateStatus("దయచేసి మాట్లాడటానికి కొంత వచనాన్ని నమోదు చేయండి.", "warning");
            return;
        }

        if (synth.speaking) {
            // This case should ideally be handled by button states, but as a safeguard:
            updateStatus("ఇప్పటికే మాట్లాడుతోంది. దయచేసి ఆపి మళ్లీ ప్రయత్నించండి.", "warning");
            return;
        }

        currentUtterance = new SpeechSynthesisUtterance(text);
        const selectedVoiceName = voiceSelect.selectedOptions[0] ? voiceSelect.selectedOptions[0].getAttribute('data-name') : null;
        if (selectedVoiceName) {
            const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
            if (selectedVoice) currentUtterance.voice = selectedVoice;
        }
        currentUtterance.lang = 'te-IN'; // Fallback/hint
        currentUtterance.rate = parseFloat(rate.value);
        currentUtterance.pitch = parseFloat(pitch.value);

        currentUtterance.onstart = () => {
            isPaused = false;
            updateStatus("మాట్లాడటం ప్రారంభమైంది...");
            updateButtonStates(true, false);
        };

        currentUtterance.onpause = () => {
            isPaused = true;
            updateStatus("పాజ్ చేయబడింది.");
            updateButtonStates(true, true);
        };

        currentUtterance.onresume = () => {
            isPaused = false;
            updateStatus("కొనసాగిస్తోంది...");
            updateButtonStates(true, false);
        };

        currentUtterance.onend = () => {
            isPaused = false;
            updateStatus("మాట్లాడటం పూర్తయింది.");
            updateButtonStates(false, false);
            currentUtterance = null;
        };

        currentUtterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            updateStatus(`లోపం: ${event.error}`, "error");
            updateButtonStates(false, false);
            currentUtterance = null;
        };

        synth.speak(currentUtterance);
    });

    pauseButton.addEventListener('click', () => {
        if (synth.speaking && !isPaused) {
            synth.pause();
        }
    });

    resumeButton.addEventListener('click', () => {
        if (synth.speaking && isPaused) {
            synth.resume();
        }
    });

    stopButton.addEventListener('click', () => {
        if (synth.speaking || synth.pending) { // Check pending too, in case it's about to start
            synth.cancel();
            // onend should fire, which will reset states.
            // If onend doesn't fire reliably after cancel on all browsers:
            // isPaused = false;
            // updateStatus("మాట్లాడటం ఆపివేయబడింది.");
            // updateButtonStates(false, false);
            // currentUtterance = null;
        }
    });
});

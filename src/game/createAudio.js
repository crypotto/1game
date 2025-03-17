function createOscillator(audioContext, frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return { oscillator, gainNode };
}

async function createAndDownloadSound(frequency, duration, filename) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const { oscillator, gainNode } = createOscillator(audioContext, frequency, duration);
    
    const mediaRecorder = new MediaRecorder(audioContext.createMediaStreamDestination().stream);
    const chunks = [];
    
    return new Promise((resolve) => {
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            resolve();
        };
        
        mediaRecorder.start();
        setTimeout(() => {
            mediaRecorder.stop();
            oscillator.stop();
            gainNode.disconnect();
        }, duration * 1000);
    });
}

// Create jump sound (higher frequency, shorter duration)
await createAndDownloadSound(600, 0.2, 'jump.wav');

// Create collect sound (medium frequency, medium duration)
await createAndDownloadSound(400, 0.3, 'collect.wav');

// Create background music (lower frequency, longer duration)
await createAndDownloadSound(200, 1.0, 'background.wav'); 
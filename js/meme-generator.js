// Meme Generator for Sad Cat Runner
// Handles creating and sharing meme images with the player's score

// Meme messages based on score
const memeMessages = [
    "You ran from {score} red flags — Still single tho",
    "Dodged {score} responsibilities — You're a legend",
    "Survived the bill avalanche — Wallet says 'why?'",
    "Life gave you lemons. You ran.",
    "You're faster than your motivation."
];

// Meme background colors
const memeBackgroundColors = [
    '#FF6B6B', // Red
    '#4D96FF', // Blue
    '#6BCB77', // Green
    '#FFD93D', // Yellow
    '#9B72AA'  // Purple
];

// Meme font styles
const memeFontStyles = [
    'Impact',
    'Arial Black',
    'Comic Sans MS',
    'Tahoma',
    'Verdana'
];

// Initialize meme generator
window.addEventListener('load', function() {
    const memeCanvas = document.getElementById('meme-canvas');
    const ctx = memeCanvas.getContext('2d');
    const shareTwitter = document.getElementById('share-twitter');
    const shareFacebook = document.getElementById('share-facebook');
    const shareDownload = document.getElementById('share-download');
    
    // Set canvas dimensions
    memeCanvas.width = 800;
    memeCanvas.height = 600;
    
    // Generate meme when game over
    function generateMeme(score) {
        // Clear canvas
        ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);
        
        // Select random background color
        const bgColor = memeBackgroundColors[Math.floor(Math.random() * memeBackgroundColors.length)];
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, memeCanvas.width, memeCanvas.height);
        
        // Draw sad cat image
        const catImage = new Image();
        catImage.src = 'assets/images/crying_cat_reference.gif';
        
        catImage.onload = function() {
            // Draw cat in center
            const catWidth = 300;
            const catHeight = 300;
            const catX = (memeCanvas.width - catWidth) / 2;
            const catY = (memeCanvas.height - catHeight) / 2 - 50;
            
            ctx.drawImage(catImage, catX, catY, catWidth, catHeight);
            
            // Select random message
            let message = memeMessages[Math.floor(Math.random() * memeMessages.length)];
            
            // Replace {score} placeholder with actual score
            message = message.replace('{score}', score);
            
            // Update meme message display
            document.getElementById('meme-message').textContent = message;
            
            // Select random font
            const fontStyle = memeFontStyles[Math.floor(Math.random() * memeFontStyles.length)];
            
            // Draw message with text stroke for better visibility
            ctx.font = `bold 40px ${fontStyle}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw text stroke
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 8;
            ctx.strokeText(message, memeCanvas.width / 2, memeCanvas.height - 150);
            
            // Draw text fill
            ctx.fillStyle = '#FFF';
            ctx.fillText(message, memeCanvas.width / 2, memeCanvas.height - 150);
            
            // Draw game title
            ctx.font = `bold 60px ${fontStyle}`;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 10;
            ctx.strokeText('SAD CAT RUNNER', memeCanvas.width / 2, 80);
            
            ctx.fillStyle = '#FFF';
            ctx.fillText('SAD CAT RUNNER', memeCanvas.width / 2, 80);
            
            // Draw score
            ctx.font = `bold 50px ${fontStyle}`;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 8;
            ctx.strokeText(`SCORE: ${score}`, memeCanvas.width / 2, memeCanvas.height - 80);
            
            ctx.fillStyle = '#FFF';
            ctx.fillText(`SCORE: ${score}`, memeCanvas.width / 2, memeCanvas.height - 80);
        };
    }
    
    // Share on Twitter
    shareTwitter.addEventListener('click', function() {
        const message = document.getElementById('meme-message').textContent;
        const score = document.getElementById('final-score').textContent;
        const tweetText = `${message} - I scored ${score} in Sad Cat Runner! #SadCatRunner #GameMeme`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        
        window.open(tweetUrl, '_blank');
    });
    
    // Share on Facebook
    shareFacebook.addEventListener('click', function() {
        const message = document.getElementById('meme-message').textContent;
        const score = document.getElementById('final-score').textContent;
        const shareText = `${message} - I scored ${score} in Sad Cat Runner!`;
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
        
        window.open(shareUrl, '_blank');
    });
    
    // Share on Facebook
    if (shareDownload) {
        shareDownload.addEventListener('click', function() {
            const dataUrl = memeCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'sad-cat-runner-meme.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    } else {
        console.error('shareDownload element not found');
    }
    
    // Expose generateMeme function globally
    window.generateMeme = generateMeme;
    
    // Generate initial meme with score 0 (will be updated when game ends)
    generateMeme(0);
});

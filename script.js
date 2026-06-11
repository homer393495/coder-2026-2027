// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Coder 2026-2027 initialized');
    
    // Button click handler
    const actionBtn = document.getElementById('actionBtn');
    if (actionBtn) {
        actionBtn.addEventListener('click', handleButtonClick);
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }

    // Project card interactions
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', handleCardClick);
    });
});

/**
 * Handle action button click
 */
function handleButtonClick() {
    const btn = event.target;
    const messages = [
        '🎉 Amazing!',
        '⭐ Awesome!',
        '🚀 Let\'s go!',
        '💪 Keep it up!',
        '🎯 On target!',
        '✨ Great click!',
        '👍 Nice work!'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    btn.textContent = randomMessage;
    
    // Reset button after 1 second
    setTimeout(() => {
        btn.textContent = 'Click Me!';
    }, 1000);
    
    // Add animation
    btn.style.animation = 'none';
    setTimeout(() => {
        btn.style.animation = 'pulse 0.5s';
    }, 10);
}

/**
 * Handle navigation link clicks with smooth scrolling
 */
function handleNavClick(e) {
    const href = this.getAttribute('href');
    
    // If it's an internal link
    if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Optional: Log navigation
            console.log(`Navigated to: ${targetId}`);
        }
    }
}

/**
 * Handle contact form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: this.children[0].value,
        email: this.children[1].value,
        message: this.children[2].value
    };
    
    console.log('Form submitted:', formData);
    
    // Simulate form submission
    alert(`Thank you, ${formData.name}! Your message has been received.`);
    
    // Reset form
    this.reset();
}

/**
 * Handle project card clicks
 */
function handleCardClick() {
    const title = this.querySelector('h3').textContent;
    console.log(`Project clicked: ${title}`);
    
    // Add active state
    this.style.backgroundColor = '#667eea';
    this.style.color = 'white';
    
    // Reset after 2 seconds
    setTimeout(() => {
        this.style.backgroundColor = 'white';
        this.style.color = 'inherit';
    }, 2000);
}

/**
 * Utility: Get current time
 */
function getCurrentTime() {
    return new Date().toLocaleTimeString();
}

/**
 * Utility: Log page info
 */
function logPageInfo() {
    console.log({
        title: document.title,
        url: window.location.href,
        timestamp: getCurrentTime(),
        userAgent: navigator.userAgent.substring(0, 50)
    });
}

// Log page info on load
logPageInfo();

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.innerHTML = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Expose useful functions to window for console testing
window.coderApp = {
    handleButtonClick,
    handleNavClick,
    handleFormSubmit,
    handleCardClick,
    getCurrentTime,
    logPageInfo
};

console.log('✨ Coder 2026-2027 ready! Access functions via window.coderApp');

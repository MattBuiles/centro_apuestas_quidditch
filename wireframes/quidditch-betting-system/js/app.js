// This file contains the main JavaScript code for the Quidditch betting system website.
// It initializes the application and handles navigation between pages.

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
});

function initApp() {
    // Set up any initial application state
    console.log('Quidditch Betting System initialized');
    
    // Add any event listeners or other initialization code here
    // that doesn't interfere with normal navigation
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetPage = event.target.getAttribute('href');
            loadPage(targetPage);
        });
    });
}

function loadPage(page) {
    // Load the selected page content
    const contentDiv = document.getElementById('content');
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            contentDiv.innerHTML = html;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}
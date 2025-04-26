// This file manages user registration and login, including form validation and error handling.

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            if (validateRegistration(username, password, confirmPassword)) {
                // Simulate registration process
                alert('Registration successful!');
                registerForm.reset();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            if (validateLogin(username, password)) {
                // Simulate login process
                alert('Login successful!');
                loginForm.reset();
            }
        });
    }

    function validateRegistration(username, password, confirmPassword) {
        if (username === '' || password === '') {
            alert('Username and password cannot be empty.');
            return false;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return false;
        }
        return true;
    }

    function validateLogin(username, password) {
        if (username === '' || password === '') {
            alert('Username and password cannot be empty.');
            return false;
        }
        return true;
    }
});
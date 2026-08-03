document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    if(localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    // Handle Login Submit via Real MongoDB Backend
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
        
        const emailInput = loginForm.querySelector('input[type="email"]').value;
        const passwordInput = loginForm.querySelector('input[type="password"]').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: emailInput, password: passwordInput })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Add "Dr." if they didn't include it in registration
                let finalName = data.name;
                if (!finalName.toLowerCase().startsWith('dr')) {
                    finalName = "Dr. " + finalName.charAt(0).toUpperCase() + finalName.slice(1);
                }
                
                localStorage.setItem('doctorName', finalName);
                window.location.href = 'index.html';
            } else {
                const err = await response.json();
                alert(err.detail || "Login failed");
                btn.innerHTML = originalText;
            }
        } catch(e) {
            console.error(e);
            alert("Error connecting to server. Is the backend running?");
            btn.innerHTML = originalText;
        }
    });

    // Handle Register Submit via Real MongoDB Backend
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Profile...';
        
        const nameInput = registerForm.querySelectorAll('input[type="text"]')[0].value;
        const instInput = registerForm.querySelectorAll('input[type="text"]')[1].value;
        const emailInput = registerForm.querySelector('input[type="email"]').value;
        const passwordInput = registerForm.querySelector('input[type="password"]').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name: nameInput, 
                    institution: instInput,
                    email: emailInput, 
                    password: passwordInput 
                })
            });
            
            if (response.ok) {
                alert('Account successfully created! You can now login.');
                btn.innerHTML = originalText;
                
                // Auto-fill login screen
                loginForm.querySelector('input[type="email"]').value = emailInput;
                loginForm.querySelector('input[type="password"]').value = passwordInput;
                
                tabLogin.click(); // Switch back to login
            } else {
                const err = await response.json();
                alert(err.detail || "Registration failed");
                btn.innerHTML = originalText;
            }
        } catch(e) {
            console.error(e);
            alert("Error connecting to server. Is the backend running?");
            btn.innerHTML = originalText;
        }
    });
});

// ===========================
// ZUZU zone-fs - JavaScript
// Author: Inukonda Jyoshna
// Location: VIT AP University, Amaravati, Andhra Pradesh
// Restaurant: ZUZU zone-fs @ Food Street
// ===========================
// ===========================
// NEO4J CONNECTION (neo4j-driver)
// ===========================
const driver = neo4j.driver(
  "neo4j+s://d02682ed.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "gHP0Hq645sSGnEO_idXnPHVk3EspX6oBEwZXEd9rP2U")
);

async function runQuery(query, params = {}) {
  const session = driver.session({ database: "neo4j" });
  try {
    const result = await session.run(query, params);
    return result.records;
  } catch (err) {
    console.error("Neo4j Error:", err);
    throw err;
  } finally {
    await session.close();
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // ===========================
    // Navigation Functionality
    // ===========================

    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Sticky navbar on scroll
    window.addEventListener('scroll', function () {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Show/hide scroll to top button
        updateScrollToTopButton();
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Close mobile menu if open
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');

            // Smooth scroll to section
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);

    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ===========================
    // Menu Filtering
    // ===========================

    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuCards = document.querySelectorAll('.menu-card');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function () {
            const category = this.getAttribute('data-category');

            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter menu cards
            menuCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 400);
                }
            });
        });
    });

    // ===========================
    // Suggest Dish Modal
    // ===========================

    const suggestDishBtn = document.getElementById('suggestDishBtn');
    const suggestDishModal = document.getElementById('suggestDishModal');
    const closeSuggestModal = document.getElementById('closeSuggestModal');
    const suggestDishForm = document.getElementById('suggestDishForm');

    // Open modal
    if (suggestDishBtn) {
        suggestDishBtn.addEventListener('click', function () {
            suggestDishModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    if (closeSuggestModal) {
        closeSuggestModal.addEventListener('click', function () {
            suggestDishModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close modal on outside click
    if (suggestDishModal) {
        suggestDishModal.addEventListener('click', function (e) {
            if (e.target === suggestDishModal) {
                suggestDishModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Handle suggest dish form submission
    if (suggestDishForm) {
        suggestDishForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('suggest-name').value.trim();
            const email = document.getElementById('suggest-email').value.trim();
            const dishName = document.getElementById('suggest-dish-name').value.trim();
            const description = document.getElementById('suggest-description').value.trim();

            // Validate all fields
            if (name && email && dishName && description) {
                runQuery(`
                    MERGE (cu:Customer {email: $email})
                    ON CREATE SET cu.name = $name, cu.createdAt = datetime()
                    CREATE (ds:DishSuggestion {
                        dishName: $dishName,
                        description: $description,
                        status: 'pending',
                        createdAt: datetime()
                    })
                    WITH cu, ds
                    MATCH (r:Restaurant {name: 'ZUZU zone-fs'})
                    CREATE (cu)-[:SUGGESTED]->(ds)
                    CREATE (ds)-[:FOR]->(r)
                `, {
                    name: name,
                    email: email,
                    dishName: dishName,
                    description: description
                })
                .then(() => {
                    showSuccessMessage('Thank You!', `Thanks for suggesting "${dishName}"! We will review it soon.`);
                    suggestDishForm.reset();
                    suggestDishModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                })
                .catch(err => {
                    console.error('Neo4j error:', err);
                    alert('Something went wrong. Please try again.');
                });
            } else {
                alert('Please fill in all fields.');
            }
        });
    }

    // ===========================
    // Form Validation - Reservation
    // ===========================

    const reservationForm = document.getElementById('reservationForm');

    if (reservationForm) {
        reservationForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Clear previous errors
            clearErrors();

            let isValid = true;

            // Get form values
            const name = document.getElementById('res-name').value.trim();
            const phone = document.getElementById('res-phone').value.trim();
            const date = document.getElementById('res-date').value;
            const time = document.getElementById('res-time').value;
            const guests = document.getElementById('res-guests').value;
            const message = document.getElementById('res-message') ? document.getElementById('res-message').value.trim() : '';

            // Validate name (at least 2 characters, only letters and spaces)
            if (name === '') {
                showError('res-name', 'name-error', 'Please enter your name');
                isValid = false;
            } else if (name.length < 2) {
                showError('res-name', 'name-error', 'Name must be at least 2 characters');
                isValid = false;
            } else if (!/^[a-zA-Z\s]+$/.test(name)) {
                showError('res-name', 'name-error', 'Name can only contain letters and spaces');
                isValid = false;
            }

            // Validate phone (Indian format - 10 digits)
            const phoneRegex = /^[\+]?[91]?[\s-]?[6-9]\d{9}$/;
            const cleanPhone = phone.replace(/[\s\-\+]/g, '');

            if (phone === '') {
                showError('res-phone', 'phone-error', 'Please enter your phone number');
                isValid = false;
            } else if (!phoneRegex.test(phone) && cleanPhone.length < 10) {
                showError('res-phone', 'phone-error', 'Please enter a valid Indian phone number');
                isValid = false;
            }

            // Validate date (must be today or future date)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(date);

            if (date === '') {
                showError('res-date', 'date-error', 'Please select a date');
                isValid = false;
            } else if (selectedDate < today) {
                showError('res-date', 'date-error', 'Please select a future date');
                isValid = false;
            }

            // Validate time
            if (time === '') {
                showError('res-time', 'time-error', 'Please select a time');
                isValid = false;
            } else {
                // Check if time is within restaurant hours (11:00 - 23:00)
                const [hours, minutes] = time.split(':').map(Number);
                const selectedTime = hours * 60 + minutes;
                const openTime = 11 * 60; // 11:00 AM
                const closeTime = 23 * 60; // 11:00 PM

                if (selectedTime < openTime || selectedTime > closeTime) {
                    showError('res-time', 'time-error', 'Please select a time between 11:00 AM and 11:00 PM');
                    isValid = false;
                }
            }

            // Validate guests
            if (guests === '') {
                showError('res-guests', 'guests-error', 'Please select number of guests');
                isValid = false;
            }

            // If all validations pass
            if (isValid) {
                runQuery(`
                    MERGE (cu:Customer {phone: $phone})
                    ON CREATE SET cu.name = $name, cu.createdAt = datetime()
                    CREATE (res:Reservation {
                        date: $date,
                        time: $time,
                        guests: toInteger($guests),
                        specialRequest: $specialRequest,
                        status: 'confirmed',
                        createdAt: datetime()
                    })
                    WITH cu, res
                    MATCH (r:Restaurant {name: 'ZUZU zone-fs'})
                    CREATE (cu)-[:MADE_RESERVATION]->(res)
                    CREATE (res)-[:AT]->(r)
                `, {
                    name: name,
                    phone: phone,
                    date: date,
                    time: time,
                    guests: neo4j.int(parseInt(guests)),
                    specialRequest: message || ''
                })
                .then(() => {
                    showSuccessMessage(
                        'Reservation Confirmed!',
                        `Your table for ${guests} on ${formatDate(date)} at ${time} is booked!`
                    );
                    reservationForm.reset();
                })
                .catch(err => {
                    console.error('Neo4j error:', err);
                    alert('Something went wrong. Please try again.');
                });
            }
        });
    }

    // ===========================
    // Form Validation - Contact
    // ===========================

    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Clear previous errors
            clearContactErrors();

            let isValid = true;

            // Get form values
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            // Validate name
            if (name === '') {
                showContactError('contact-name', 'contact-name-error', 'Please enter your name');
                isValid = false;
            } else if (name.length < 2) {
                showContactError('contact-name', 'contact-name-error', 'Name must be at least 2 characters');
                isValid = false;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email === '') {
                showContactError('contact-email', 'contact-email-error', 'Please enter your email');
                isValid = false;
            } else if (!emailRegex.test(email)) {
                showContactError('contact-email', 'contact-email-error', 'Please enter a valid email address');
                isValid = false;
            }

            // Validate subject
            if (subject === '') {
                showContactError('contact-subject', 'contact-subject-error', 'Please enter a subject');
                isValid = false;
            } else if (subject.length < 3) {
                showContactError('contact-subject', 'contact-subject-error', 'Subject must be at least 3 characters');
                isValid = false;
            }

            // Validate message
            if (message === '') {
                showContactError('contact-message', 'contact-message-error', 'Please enter your message');
                isValid = false;
            } else if (message.length < 10) {
                showContactError('contact-message', 'contact-message-error', 'Message must be at least 10 characters');
                isValid = false;
            }

            // If all validations pass
            if (isValid) {
                runQuery(`
                    MERGE (cu:Customer {email: $email})
                    ON CREATE SET cu.name = $name, cu.createdAt = datetime()
                    CREATE (msg:ContactMessage {
                        subject: $subject,
                        message: $message,
                        status: 'unread',
                        createdAt: datetime()
                    })
                    WITH cu, msg
                    MATCH (r:Restaurant {name: 'ZUZU zone-fs'})
                    CREATE (cu)-[:SENT_MESSAGE]->(msg)
                    CREATE (msg)-[:TO]->(r)
                `, {
                    name: name,
                    email: email,
                    subject: subject,
                    message: message
                })
                .then(() => {
                    showSuccessMessage('Message Sent!', 'Thank you! We will get back to you soon.');
                    contactForm.reset();
                })
                .catch(err => {
                    console.error('Neo4j error:', err);
                    alert('Something went wrong. Please try again.');
                });
            }
        });
    }

    // ===========================
    // Helper Functions
    // ===========================

    function showError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const errorElement = document.getElementById(errorId);

        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    function showContactError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const errorElement = document.getElementById(errorId);

        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    function clearErrors() {
        const errorInputs = reservationForm.querySelectorAll('.error');
        const errorMessages = reservationForm.querySelectorAll('.error-message');

        errorInputs.forEach(input => input.classList.remove('error'));
        errorMessages.forEach(msg => {
            msg.textContent = '';
            msg.style.display = 'none';
        });
    }

    function clearContactErrors() {
        const errorInputs = contactForm.querySelectorAll('.error');
        const errorMessages = contactForm.querySelectorAll('.error-message');

        errorInputs.forEach(input => input.classList.remove('error'));
        errorMessages.forEach(msg => {
            msg.textContent = '';
            msg.style.display = 'none';
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-IN', options);
    }

    function showSuccessMessage(title, message) {
        // Create success modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%);
            padding: 3rem;
            border-radius: 12px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            border: 2px solid #D4AF37;
            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.3);
            animation: slideUp 0.3s ease;
        `;

        modalContent.innerHTML = `
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #D4AF37, #FFD700); 
                        border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                        margin: 0 auto 1.5rem; box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);">
                <i class="fas fa-check" style="font-size: 2.5rem; color: #0A0A0A;"></i>
            </div>
            <h2 style="font-family: 'Playfair Display', serif; font-size: 2rem; color: #D4AF37; margin-bottom: 1rem;">
                ${title}
            </h2>
            <p style="font-family: 'Montserrat', sans-serif; font-size: 1.1rem; color: #E0E0E0; margin-bottom: 2rem; line-height: 1.6;">
                ${message}
            </p>
            <button id="closeModal" style="padding: 1rem 2.5rem; background: linear-gradient(135deg, #D4AF37, #FFD700); 
                                           color: #0A0A0A; border: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; 
                                           font-size: 1rem; font-weight: 600; cursor: pointer; text-transform: uppercase; 
                                           letter-spacing: 1px; transition: all 0.3s ease;">
                Close
            </button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Close modal
        document.getElementById('closeModal').addEventListener('click', function () {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            }, 300);
        });

        // Close on outside click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    document.head.removeChild(style);
                }, 300);
            }
        });
    }

    // ===========================
    // Scroll to Top Button
    // ===========================

    const scrollToTopBtn = document.getElementById('scrollToTop');

    function updateScrollToTopButton() {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }

    scrollToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ===========================
    // Gallery Lightbox Effect
    // ===========================

    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', function () {
            const img = this.querySelector('img');
            createLightbox(img.src, img.alt);
        });
    });

    function createLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
            animation: fadeIn 0.3s ease;
        `;

        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.5);
            animation: zoomIn 0.3s ease;
        `;

        lightbox.appendChild(img);
        document.body.appendChild(lightbox);

        // Add zoom animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes zoomIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Close on click
        lightbox.addEventListener('click', function () {
            lightbox.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(lightbox);
                document.head.removeChild(style);
            }, 300);
        });
    }

    // ===========================
    // Newsletter Form
    // ===========================

    const newsletterForm = document.querySelector('.newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = this.querySelector('input').value;

            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showSuccessMessage('Subscribed!', 'Thank you for subscribing to Royal Restaurant newsletter! You\'ll receive updates about our latest dishes and special offers.');
                this.reset();
            } else {
                alert('Please enter a valid email address');
            }
        });
    }

    // ===========================
    // Real-time Input Validation
    // ===========================

    // Add input event listeners for real-time feedback
    const formInputs = document.querySelectorAll('input[required], select[required], textarea[required]');

    formInputs.forEach(input => {
        input.addEventListener('input', function () {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.style.display = 'none';
                }
            }
        });

        // Add focus effect
        input.addEventListener('focus', function () {
            this.style.transform = 'scale(1.02)';
        });

        input.addEventListener('blur', function () {
            this.style.transform = 'scale(1)';
        });
    });

    // ===========================
    // Set minimum date for reservation
    // ===========================

    const dateInput = document.getElementById('res-date');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');

        dateInput.min = `${year}-${month}-${day}`;
    }

    // ===========================
    // Loading Animation
    // ===========================

    window.addEventListener('load', function () {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        }, 100);
    });

    // ===========================
    // Console Message
    // ===========================

    console.log('%c🍽️ Royal Restaurant Website', 'color: #D4AF37; font-size: 24px; font-weight: bold;');
    console.log('%cDesigned by Inukonda Jyoshna', 'color: #FFD700; font-size: 14px;');
    console.log('%cLocation: MG Colony, Vijayawada', 'color: #A0A0A0; font-size: 12px;');
    console.log('%c© 2025 All Rights Reserved', 'color: #A0A0A0; font-size: 12px;');

});
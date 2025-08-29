// Main JavaScript for Virtual Try-On website
(function() {
    'use strict';

    // DOM ready function
    function domReady(fn) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(fn, 1);
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    // Smooth scrolling for anchor links
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Header scroll effect
    function initHeaderScroll() {
        const header = document.querySelector('.header');
        let lastScrollTop = 0;

        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Add shadow when scrolled
            if (scrollTop > 10) {
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // FAQ accordion functionality (if FAQ page exists)
    function initFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const faqItem = this.parentElement;
                const answer = faqItem.querySelector('.faq-answer');
                const isOpen = faqItem.classList.contains('open');
                
                // Close all other FAQ items
                faqQuestions.forEach(q => {
                    const item = q.parentElement;
                    const ans = item.querySelector('.faq-answer');
                    item.classList.remove('open');
                    ans.style.maxHeight = '0';
                });
                
                // Toggle current item
                if (!isOpen) {
                    faqItem.classList.add('open');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        });
    }

    // Mobile menu toggle
    function initMobileMenu() {
        // Add mobile menu button if not exists
        const nav = document.querySelector('.nav');
        const navLinks = document.querySelector('.nav-links');
        
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-toggle')) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = '☰';
            mobileToggle.style.cssText = `
                display: block;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #333;
                padding: 8px;
                border-radius: 4px;
            `;
            
            nav.insertBefore(mobileToggle, navLinks);
            
            mobileToggle.addEventListener('click', function() {
                navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            });
        }
    }

    // Form validation (for support forms if added later)
    function initFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.style.borderColor = '#dc3545';
                        isValid = false;
                    } else {
                        field.style.borderColor = '#ced4da';
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    alert('Please fill in all required fields.');
                }
            });
        });
    }

    // Intersection Observer for animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Animate elements on scroll
        const animateElements = document.querySelectorAll('.step, .feature, .screenshot-item');
        animateElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    }

    // Handle external links
    function initExternalLinks() {
        const externalLinks = document.querySelectorAll('a[href^="http"], a[href^="mailto:"]');
        
        externalLinks.forEach(link => {
            if (!link.hostname || link.hostname !== window.location.hostname) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // Track button clicks (for analytics if needed later)
    function initButtonTracking() {
        const ctaButtons = document.querySelectorAll('.btn-primary');
        
        ctaButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Future: Add analytics tracking here
                console.log('CTA clicked:', this.textContent.trim());
            });
        });
    }

    // Handle image loading errors
    function initImageErrorHandling() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            img.addEventListener('error', function() {
                // Create a placeholder div with the same dimensions
                const placeholder = document.createElement('div');
                placeholder.style.cssText = `
                    width: ${this.width || 200}px;
                    height: ${this.height || 200}px;
                    background: #e9ecef;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6c757d;
                    font-size: 14px;
                    border-radius: 6px;
                `;
                placeholder.textContent = 'Image placeholder';
                
                if (this.parentNode) {
                    this.parentNode.replaceChild(placeholder, this);
                }
            });
        });
    }

    // Resize handler
    function handleResize() {
        // Reinitialize mobile menu on resize
        if (window.innerWidth > 768) {
            const navLinks = document.querySelector('.nav-links');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            
            if (navLinks) {
                navLinks.style.display = 'flex';
            }
            
            if (mobileToggle) {
                mobileToggle.remove();
            }
        } else {
            initMobileMenu();
        }
    }

    // Initialize all functionality when DOM is ready
    domReady(function() {
        initSmoothScroll();
        initHeaderScroll();
        initFAQ();
        initMobileMenu();
        initFormValidation();
        initScrollAnimations();
        initExternalLinks();
        initButtonTracking();
        initImageErrorHandling();
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
        
        console.log('Virtual Try-On website initialized');
    });

})();
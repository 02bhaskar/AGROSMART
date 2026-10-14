// Agro Smart Farming Frontend Logic
(() => {
  // Global State
  const state = {
    currentLang: localStorage.getItem('agro_lang') || 'en',
    translations: {},
    token: localStorage.getItem('agro_token') || null,
    farmer: JSON.parse(localStorage.getItem('agro_farmer') || 'null'),
    currentWeather: null,
    lastOtpPhoneNumber: null
  };

  // DOM Elements
  const elements = {
    // Nav
    mainNavLinks: document.getElementById('main-nav-links'),
    navDashboardBtn: document.getElementById('nav-dashboard-btn'),
    navWeatherBtn: document.getElementById('nav-weather-btn'),
    navRecommendationBtn: document.getElementById('nav-recommendation-btn'),
    languageSwitcher: document.getElementById('language-switcher'),
    logoutBtn: document.getElementById('logout-btn'),
    navBrand: document.getElementById('nav-brand'),
    navDashboardText: document.getElementById('nav-dashboard-text'),
    navWeatherText: document.getElementById('nav-weather-text'),
    navRecommendationText: document.getElementById('nav-recommendation-text'),

    // Views
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    weatherView: document.getElementById('weather-view'),

    // Auth Tabs
    tabLoginBtn: document.getElementById('tab-login-btn'),
    tabSignupBtn: document.getElementById('tab-signup-btn'),
    loginFormContainer: document.getElementById('login-form-container'),
    signupFormContainer: document.getElementById('signup-form-container'),
    switchToSignup: document.getElementById('switch-to-signup'),
    switchToLogin: document.getElementById('switch-to-login'),

    // Login Form
    loginForm: document.getElementById('login-form'),
    loginPhone: document.getElementById('login-phone'),
    loginSendOtpBtn: document.getElementById('login-send-otp-btn'),
    loginOtpSection: document.getElementById('login-otp-section'),
    loginOtp: document.getElementById('login-otp'),
    loginVerifyOtpBtn: document.getElementById('login-verify-otp-btn'),

    // Signup Form
    signupForm: document.getElementById('signup-form'),
    signupName: document.getElementById('signup-name'),
    signupPhone: document.getElementById('signup-phone'),
    signupDistrict: document.getElementById('signup-district'),
    signupSendOtpBtn: document.getElementById('signup-send-otp-btn'),
    signupOtpSection: document.getElementById('signup-otp-section'),
    signupOtp: document.getElementById('signup-otp'),
    signupVerifyOtpBtn: document.getElementById('signup-verify-otp-btn'),

    // Dashboard
    dashboardWelcome: document.getElementById('dashboard-welcome'),
    farmerDistrictBadge: document.getElementById('farmer-district-badge'),
    weatherLocationDisplay: document.getElementById('weather-location-display'),
    weatherTempDisplay: document.getElementById('weather-temp-display'),
    weatherDescDisplay: document.getElementById('weather-desc-display'),
    weatherHumidityDisplay: document.getElementById('weather-humidity-display'),
    weatherWindDisplay: document.getElementById('weather-wind-display'),
    weatherPressureDisplay: document.getElementById('weather-pressure-display'),
    refreshWeatherBtn: document.getElementById('refresh-weather-btn'),

    // Recommendation Form
    recommendationForm: document.getElementById('recommendation-form'),
    recSoilType: document.getElementById('rec-soil-type'),
    recAcres: document.getElementById('rec-acres'),
    recSubmitBtn: document.getElementById('rec-submit-btn'),

    // Recommendation Results
    recommendationResultContainer: document.getElementById('recommendation-result-container'),
    resLandArea: document.getElementById('res-land-area'),
    resSoilType: document.getElementById('res-soil-type'),
    resSeason: document.getElementById('res-season'),
    resClimate: document.getElementById('res-climate'),
    resCropsList: document.getElementById('res-crops-list'),
    resFertilizersList: document.getElementById('res-fertilizers-list'),
    resProfit: document.getElementById('res-profit'),
    resReason: document.getElementById('res-reason'),
    resBackBtn: document.getElementById('res-back-btn'),

    // Weather Explorer
    weatherSearchInput: document.getElementById('weather-search-input'),
    weatherSearchBtn: document.getElementById('weather-search-btn'),
    explorerWeatherResult: document.getElementById('explorer-weather-result'),
    toastContainer: document.getElementById('toast-container')
  };

  // Toast notifications
  function showToast(message, type = 'info', actionBtn = null) {
    const toast = document.createElement('div');
    toast.className = `toast-notice ${type}`;
    
    const textSpan = document.createElement('span');
    textSpan.innerHTML = message;
    toast.appendChild(textSpan);

    if (actionBtn) {
      toast.appendChild(actionBtn);
    }

    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5500);
  }

  // Format Indian Currency
  function formatIndianCurrency(num) {
    if (isNaN(num)) return '₹0';
    return '₹' + Number(num).toLocaleString('en-IN');
  }

  // Load Translations
  async function loadTranslations(lang) {
    try {
      const res = await fetch(`/locales/${lang}.json`);
      if (!res.ok) throw new Error('Translation not found');
      state.translations = await res.json();
      state.currentLang = lang;
      localStorage.setItem('agro_lang', lang);
      elements.languageSwitcher.value = lang;
      applyTranslations();
    } catch (err) {
      console.warn('Falling back to default language', err);
    }
  }

  // Apply translations to UI
  function applyTranslations() {
    const t = state.translations;
    if (!t) return;

    if (t.navbar) {
      if (elements.navBrand) elements.navBrand.textContent = t.navbar.brand;
      if (elements.navDashboardText) elements.navDashboardText.textContent = t.navbar.dashboard;
      if (elements.navWeatherText) elements.navWeatherText.textContent = t.navbar.weather;
      if (elements.navRecommendationText) elements.navRecommendationText.textContent = t.navbar.recommendation;
      if (elements.logoutBtn) elements.logoutBtn.textContent = t.navbar.logout;
    }

    if (t.dashboard && state.farmer) {
      const welcomeTemplate = t.dashboard.welcome || "Welcome, {name}!";
      elements.dashboardWelcome.textContent = welcomeTemplate.replace('{name}', state.farmer.name);
      
      const recForm = t.dashboard.recommendationForm;
      if (recForm) {
        document.getElementById('rec-form-title').textContent = recForm.title;
        document.getElementById('rec-soil-label').textContent = recForm.soilTypeLabel;
        document.getElementById('rec-acres-label').textContent = recForm.acresLabel;
        document.getElementById('rec-acres').placeholder = recForm.acresPlaceholder;
        document.getElementById('rec-submit-text').textContent = recForm.submitButton;
      }
    }

    if (t.login) {
      document.getElementById('login-title').textContent = t.login.title;
      document.getElementById('login-phone').placeholder = t.login.phonePlaceholder;
      document.getElementById('login-send-otp-text').textContent = t.login.sendOTPButton;
      document.getElementById('login-otp-message').textContent = t.login.otpMessage;
      document.getElementById('login-otp').placeholder = t.login.otpPlaceholder;
      document.getElementById('login-verify-otp-text').textContent = t.login.verifyOTPButton;
      document.getElementById('login-no-account-text').textContent = t.login.noAccount;
      elements.switchToSignup.textContent = t.login.signupLink;
    }

    if (t.signup) {
      document.getElementById('signup-title').textContent = t.signup.title;
      document.getElementById('signup-name').placeholder = t.signup.namePlaceholder;
      document.getElementById('signup-phone').placeholder = t.signup.phonePlaceholder;
      document.getElementById('signup-district').placeholder = t.signup.districtPlaceholder;
      document.getElementById('signup-send-otp-text').textContent = t.signup.sendOTPButton;
      document.getElementById('signup-otp-message').textContent = t.signup.otpMessage;
      document.getElementById('signup-otp').placeholder = t.signup.otpPlaceholder;
      document.getElementById('signup-verify-otp-text').textContent = t.signup.verifyOTPButton;
      document.getElementById('signup-already-account-text').textContent = t.signup.alreadyHaveAccount;
      elements.switchToLogin.textContent = t.signup.loginLink;
    }

    if (t.recommendation) {
      document.getElementById('res-title').textContent = t.recommendation.title;
      document.getElementById('res-back-btn').textContent = t.recommendation.backButton;
    }
  }

  // Navigation switching
  function showView(viewName) {
    elements.authView.classList.add('hidden');
    elements.dashboardView.classList.add('hidden');
    elements.weatherView.classList.add('hidden');

    elements.navDashboardBtn.classList.remove('active');
    elements.navWeatherBtn.classList.remove('active');
    elements.navRecommendationBtn.classList.remove('active');

    if (viewName === 'auth') {
      elements.authView.classList.remove('hidden');
      elements.mainNavLinks.style.display = 'none';
      elements.logoutBtn.style.display = 'none';
    } else if (viewName === 'dashboard') {
      elements.dashboardView.classList.remove('hidden');
      elements.mainNavLinks.style.display = 'flex';
      elements.logoutBtn.style.display = 'block';
      elements.navDashboardBtn.classList.add('active');
      elements.recommendationResultContainer.classList.add('hidden');
    } else if (viewName === 'weather') {
      elements.weatherView.classList.remove('hidden');
      elements.mainNavLinks.style.display = 'flex';
      elements.logoutBtn.style.display = 'block';
      elements.navWeatherBtn.classList.add('active');
      if (!elements.explorerWeatherResult.children.length) {
        searchWeatherForDistrict(state.farmer ? state.farmer.district : 'Coimbatore');
      }
    } else if (viewName === 'recommendation') {
      elements.dashboardView.classList.remove('hidden');
      elements.mainNavLinks.style.display = 'flex';
      elements.logoutBtn.style.display = 'block';
      elements.navRecommendationBtn.classList.add('active');
      document.getElementById('recommendation-form-card').scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Weather Fetching for Farmer Dashboard
  async function loadDashboardWeather(district) {
    try {
      elements.refreshWeatherBtn.style.animation = 'spin 1s infinite linear';
      const res = await fetch(`/api/weather/${encodeURIComponent(district)}`);
      const data = await res.json();
      elements.refreshWeatherBtn.style.animation = '';

      if (data.success && data.weather) {
        const w = data.weather;
        state.currentWeather = w;
        elements.weatherLocationDisplay.textContent = `Weather in ${w.location}`;
        elements.weatherTempDisplay.textContent = `${w.temperature}°C`;
        elements.weatherDescDisplay.textContent = w.description;
        elements.weatherHumidityDisplay.textContent = `${w.humidity}%`;
        elements.weatherWindDisplay.textContent = `${w.windSpeed} m/s`;
        elements.weatherPressureDisplay.textContent = `${w.pressure} hPa`;

        // Weather icon selector
        const condition = (w.description || '').toLowerCase();
        let icon = '⛅';
        if (condition.includes('rain') || condition.includes('drizzle')) icon = '🌧️';
        else if (condition.includes('clear') || condition.includes('sun')) icon = '☀️';
        else if (condition.includes('cloud')) icon = '☁️';
        else if (condition.includes('thunder')) icon = '⛈️';
        document.getElementById('weather-large-icon').textContent = icon;
      }
    } catch (err) {
      console.error('Failed to load dashboard weather', err);
      elements.refreshWeatherBtn.style.animation = '';
    }
  }

  // Weather Explorer search
  async function searchWeatherForDistrict(district) {
    if (!district) return;
    elements.weatherSearchBtn.disabled = true;
    elements.weatherSearchBtn.textContent = 'Searching...';

    try {
      const res = await fetch(`/api/weather/${encodeURIComponent(district)}`);
      const data = await res.json();
      elements.weatherSearchBtn.disabled = false;
      elements.weatherSearchBtn.textContent = 'Search';

      if (data.success && data.weather) {
        const w = data.weather;
        elements.explorerWeatherResult.innerHTML = `
          <div class="weather-hero" style="animation: slideUp 0.3s ease;">
            <div class="weather-header">
              <div>
                <span class="weather-badge">${w.isFallback ? 'Simulated Regional Profile' : 'Live OpenWeather Station'}</span>
                <div class="weather-location" style="font-size: 1.5rem; margin-top: 0.25rem;">${w.location} Meteorological Advisory</div>
              </div>
              <div style="font-size: 2.5rem;">⛅</div>
            </div>

            <div class="weather-temp-row">
              <div>
                <div class="temp-large">${w.temperature}°C</div>
                <div class="weather-desc-pill">
                  <span>Conditions:</span>
                  <strong>${w.description}</strong>
                  <span style="opacity: 0.8;">(Feels like ${w.feelsLike}°C)</span>
                </div>
              </div>
            </div>

            <div class="weather-metrics-grid" style="grid-template-columns: repeat(4, 1fr);">
              <div class="metric-item">
                <div class="metric-label">Humidity</div>
                <div class="metric-value">${w.humidity}%</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Wind Speed</div>
                <div class="metric-value">${w.windSpeed} m/s</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Pressure</div>
                <div class="metric-value">${w.pressure} hPa</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Sunrise / Sunset</div>
                <div class="metric-value">${w.sunrise} / ${w.sunset}</div>
              </div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      elements.weatherSearchBtn.disabled = false;
      elements.weatherSearchBtn.textContent = 'Search';
      showToast('Error fetching weather data', 'error');
    }
  }

  // Recommendation Submission
  elements.recommendationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const soilType = elements.recSoilType.value;
    const acres = parseFloat(elements.recAcres.value);

    if (!soilType || !acres || acres <= 0) {
      showToast('Please provide valid soil type and land area.', 'error');
      return;
    }

    elements.recSubmitBtn.disabled = true;
    elements.recSubmitBtn.innerHTML = '<span>🌱 Computing Agro Recommendations...</span>';

    try {
      const res = await fetch('/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ soilType, acres })
      });

      const data = await res.json();
      elements.recSubmitBtn.disabled = false;
      elements.recSubmitBtn.innerHTML = '<span id="rec-submit-text">Get Recommendations</span>';
      applyTranslations();

      if (data.success && data.recommendation) {
        const r = data.recommendation;

        elements.resLandArea.textContent = `${r.acres} Acres`;
        elements.resSoilType.textContent = r.soilType;
        elements.resSeason.textContent = r.season;
        elements.resClimate.textContent = `${r.temperature}°C • ${r.humidity}% Humidity`;
        elements.resProfit.textContent = formatIndianCurrency(r.profit);
        elements.resReason.textContent = r.reason;

        // Render Crop badges
        elements.resCropsList.innerHTML = r.crops
          .map(crop => `<span class="badge-tag crop">🌱 ${crop}</span>`)
          .join('');

        // Render Fertilizer badges
        elements.resFertilizersList.innerHTML = r.fertilizers
          .map(fert => `<span class="badge-tag fertilizer">🧪 ${fert}</span>`)
          .join('');

        elements.recommendationResultContainer.classList.remove('hidden');
        elements.recommendationResultContainer.scrollIntoView({ behavior: 'smooth' });
        showToast('Optimal recommendation calculated successfully!', 'success');
      } else {
        showToast(data.message || 'Error generating recommendation', 'error');
      }
    } catch (err) {
      elements.recSubmitBtn.disabled = false;
      elements.recSubmitBtn.innerHTML = '<span id="rec-submit-text">Get Recommendations</span>';
      showToast('Server error generating recommendation', 'error');
    }
  });

  // Back from recommendation result
  elements.resBackBtn.addEventListener('click', () => {
    elements.recommendationResultContainer.classList.add('hidden');
    elements.recommendationForm.scrollIntoView({ behavior: 'smooth' });
  });

  // Verify stored profile on launch
  async function checkAuthSession() {
    if (!state.token) {
      showView('auth');
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();

      if (data.success && data.farmer) {
        state.farmer = data.farmer;
        localStorage.setItem('agro_farmer', JSON.stringify(data.farmer));
        elements.farmerDistrictBadge.textContent = `📍 District: ${data.farmer.district}`;
        applyTranslations();
        showView('dashboard');
        loadDashboardWeather(data.farmer.district);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session verification failed, logging out', err);
      logout();
    }
  }

  // Logout
  function logout() {
    state.token = null;
    state.farmer = null;
    localStorage.removeItem('agro_token');
    localStorage.removeItem('agro_farmer');
    showToast('Logged out successfully', 'info');
    showView('auth');
  }

  // Tab switching: Login / Signup
  elements.tabLoginBtn.addEventListener('click', () => {
    elements.tabLoginBtn.classList.add('active');
    elements.tabSignupBtn.classList.remove('active');
    elements.loginFormContainer.classList.remove('hidden');
    elements.signupFormContainer.classList.add('hidden');
  });

  elements.tabSignupBtn.addEventListener('click', () => {
    elements.tabSignupBtn.classList.add('active');
    elements.tabLoginBtn.classList.remove('active');
    elements.signupFormContainer.classList.remove('hidden');
    elements.loginFormContainer.classList.add('hidden');
  });

  elements.switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    elements.tabSignupBtn.click();
  });

  elements.switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    elements.tabLoginBtn.click();
  });

  // Login: Send OTP
  elements.loginSendOtpBtn.addEventListener('click', async () => {
    const phoneNumber = elements.loginPhone.value.trim();
    if (!phoneNumber) {
      showToast('Please enter your phone number.', 'error');
      return;
    }

    elements.loginSendOtpBtn.disabled = true;
    elements.loginSendOtpBtn.textContent = 'Generating OTP...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      elements.loginSendOtpBtn.disabled = false;
      elements.loginSendOtpBtn.textContent = 'Generate OTP';

      if (data.success) {
        state.lastOtpPhoneNumber = phoneNumber;
        elements.loginOtpSection.classList.remove('hidden');
        
        // Show convenience auto-fill OTP toast
        const fillBtn = document.createElement('button');
        fillBtn.className = 'btn-logout';
        fillBtn.style.background = '#d1fae5';
        fillBtn.style.color = '#065f46';
        fillBtn.style.marginLeft = '10px';
        fillBtn.textContent = `Auto-fill (${data.otp})`;
        fillBtn.onclick = () => {
          elements.loginOtp.value = data.otp;
        };

        showToast(`📲 OTP sent to ${phoneNumber}: <strong>${data.otp}</strong>`, 'success', fillBtn);
        elements.loginOtp.value = data.otp; // Convenience pre-fill for demo
        elements.loginOtp.focus();
      } else {
        showToast(data.message || 'Farmer not found. Please sign up first.', 'error');
      }
    } catch (err) {
      elements.loginSendOtpBtn.disabled = false;
      elements.loginSendOtpBtn.textContent = 'Generate OTP';
      showToast('Network error generating OTP.', 'error');
    }
  });

  // Login: Verify OTP
  elements.loginVerifyOtpBtn.addEventListener('click', async () => {
    const phoneNumber = elements.loginPhone.value.trim();
    const otp = elements.loginOtp.value.trim();

    if (!phoneNumber || !otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP.', 'error');
      return;
    }

    elements.loginVerifyOtpBtn.disabled = true;
    elements.loginVerifyOtpBtn.textContent = 'Verifying...';

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });
      const data = await res.json();
      elements.loginVerifyOtpBtn.disabled = false;
      elements.loginVerifyOtpBtn.textContent = 'Verify OTP';

      if (data.success && data.token) {
        state.token = data.token;
        state.farmer = data.farmer;
        localStorage.setItem('agro_token', data.token);
        localStorage.setItem('agro_farmer', JSON.stringify(data.farmer));

        showToast(`Welcome back, ${data.farmer.name}!`, 'success');
        elements.farmerDistrictBadge.textContent = `📍 District: ${data.farmer.district}`;
        applyTranslations();
        showView('dashboard');
        loadDashboardWeather(data.farmer.district);
      } else {
        showToast(data.message || 'Invalid or expired OTP', 'error');
      }
    } catch (err) {
      elements.loginVerifyOtpBtn.disabled = false;
      elements.loginVerifyOtpBtn.textContent = 'Verify OTP';
      showToast('Network error during verification', 'error');
    }
  });

  // Signup: Send OTP
  elements.signupSendOtpBtn.addEventListener('click', async () => {
    const name = elements.signupName.value.trim();
    const phoneNumber = elements.signupPhone.value.trim();
    const district = elements.signupDistrict.value.trim();

    if (!name || !phoneNumber || !district) {
      showToast('Please fill in Name, Phone, and District.', 'error');
      return;
    }

    elements.signupSendOtpBtn.disabled = true;
    elements.signupSendOtpBtn.textContent = 'Generating OTP...';

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phoneNumber, district })
      });
      const data = await res.json();
      elements.signupSendOtpBtn.disabled = false;
      elements.signupSendOtpBtn.textContent = 'Generate OTP';

      if (data.success) {
        state.lastOtpPhoneNumber = phoneNumber;
        elements.signupOtpSection.classList.remove('hidden');

        // Show convenience auto-fill OTP toast
        const fillBtn = document.createElement('button');
        fillBtn.className = 'btn-logout';
        fillBtn.style.background = '#d1fae5';
        fillBtn.style.color = '#065f46';
        fillBtn.style.marginLeft = '10px';
        fillBtn.textContent = `Auto-fill (${data.otp})`;
        fillBtn.onclick = () => {
          elements.signupOtp.value = data.otp;
        };

        showToast(`📲 OTP sent to ${phoneNumber}: <strong>${data.otp}</strong>`, 'success', fillBtn);
        elements.signupOtp.value = data.otp; // Convenience pre-fill for demo
        elements.signupOtp.focus();
      } else {
        showToast(data.message || 'Signup failed', 'error');
      }
    } catch (err) {
      elements.signupSendOtpBtn.disabled = false;
      elements.signupSendOtpBtn.textContent = 'Generate OTP';
      showToast('Network error during signup.', 'error');
    }
  });

  // Signup: Verify OTP
  elements.signupVerifyOtpBtn.addEventListener('click', async () => {
    const phoneNumber = elements.signupPhone.value.trim();
    const otp = elements.signupOtp.value.trim();

    if (!phoneNumber || !otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP.', 'error');
      return;
    }

    elements.signupVerifyOtpBtn.disabled = true;
    elements.signupVerifyOtpBtn.textContent = 'Verifying...';

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });
      const data = await res.json();
      elements.signupVerifyOtpBtn.disabled = false;
      elements.signupVerifyOtpBtn.textContent = 'Verify OTP';

      if (data.success && data.token) {
        state.token = data.token;
        state.farmer = data.farmer;
        localStorage.setItem('agro_token', data.token);
        localStorage.setItem('agro_farmer', JSON.stringify(data.farmer));

        showToast(`Account created successfully! Welcome, ${data.farmer.name}!`, 'success');
        elements.farmerDistrictBadge.textContent = `📍 District: ${data.farmer.district}`;
        applyTranslations();
        showView('dashboard');
        loadDashboardWeather(data.farmer.district);
      } else {
        showToast(data.message || 'Invalid OTP', 'error');
      }
    } catch (err) {
      elements.signupVerifyOtpBtn.disabled = false;
      elements.signupVerifyOtpBtn.textContent = 'Verify OTP';
      showToast('Network error during verification', 'error');
    }
  });

  // Navigation Links
  elements.navDashboardBtn.addEventListener('click', () => showView('dashboard'));
  elements.navWeatherBtn.addEventListener('click', () => showView('weather'));
  elements.navRecommendationBtn.addEventListener('click', () => showView('recommendation'));
  elements.logoutBtn.addEventListener('click', logout);

  // Refresh Weather
  elements.refreshWeatherBtn.addEventListener('click', () => {
    if (state.farmer && state.farmer.district) {
      loadDashboardWeather(state.farmer.district);
    }
  });

  // Weather Search
  elements.weatherSearchBtn.addEventListener('click', () => {
    searchWeatherForDistrict(elements.weatherSearchInput.value.trim());
  });

  elements.weatherSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchWeatherForDistrict(elements.weatherSearchInput.value.trim());
    }
  });

  // Quick District Badges in Weather Explorer
  document.querySelectorAll('.quick-district-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const city = btn.getAttribute('data-city');
      elements.weatherSearchInput.value = city;
      searchWeatherForDistrict(city);
    });
  });

  // Language Switcher
  elements.languageSwitcher.addEventListener('change', (e) => {
    loadTranslations(e.target.value);
  });

  // Initialize
  loadTranslations(state.currentLang);
  checkAuthSession();
})();

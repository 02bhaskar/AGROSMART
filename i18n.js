let translations = {};
let currentLang = localStorage.getItem('language') || 'ta'; // Default to Tamil

// Load translations for a given language
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    translations[lang] = await response.json();
    console.log(`Loaded translations for ${lang}`);
  } catch (err) {
    console.error(`Error loading translations for ${lang}:`, err);
    if (lang !== 'en') {
      console.log('Falling back to English translations');
      await loadTranslations('en');
      currentLang = 'en';
      localStorage.setItem('language', 'en');
    }
  }
}

// Apply translations to the page
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);
    if (translation) {
      if (element.hasAttribute('data-i18n-name')) {
        element.innerHTML = translation.replace('{name}', element.getAttribute('data-i18n-name'));
      } else if (element.hasAttribute('data-i18n-temperature')) {
        element.innerHTML = translation.replace('{temperature}', `<span id="temperature">${document.getElementById('temperature')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-humidity')) {
        element.innerHTML = translation.replace('{humidity}', `<span id="humidity">${document.getElementById('humidity')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-description')) {
        element.innerHTML = translation.replace('{description}', `<span id="description">${document.getElementById('description')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-location')) {
        element.innerHTML = translation.replace('{location}', `<span id="location">${document.getElementById('location')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-windSpeed')) {
        element.innerHTML = translation.replace('{windSpeed}', `<span id="windSpeed">${document.getElementById('windSpeed')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-pressure')) {
        element.innerHTML = translation.replace('{pressure}', `<span id="pressure">${document.getElementById('pressure')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-sunrise')) {
        element.innerHTML = translation.replace('{sunrise}', `<span id="sunrise">${document.getElementById('sunrise')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-sunset')) {
        element.innerHTML = translation.replace('{sunset}', `<span id="sunset">${document.getElementById('sunset')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-acres')) {
        element.innerHTML = translation.replace('{acres}', `<span id="landArea">${document.getElementById('landArea')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-soilType')) {
        element.innerHTML = translation.replace('{soilType}', `<span id="soilType">${document.getElementById('soilType')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-season')) {
        element.innerHTML = translation.replace('{season}', `<span id="season">${document.getElementById('season')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-crops')) {
        element.innerHTML = translation.replace('{crops}', `<span id="crops">${document.getElementById('crops')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-fertilizers')) {
        element.innerHTML = translation.replace('{fertilizers}', `<span id="fertilizers">${document.getElementById('fertilizers')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-profit')) {
        element.innerHTML = translation.replace('{profit}', `<span id="profit">${document.getElementById('profit')?.textContent || 'N/A'}</span>`);
      } else if (element.hasAttribute('data-i18n-reason')) {
        element.innerHTML = translation.replace('{reason}', `<span id="reason">${document.getElementById('reason')?.textContent || 'N/A'}</span>`);
      } else {
        element.textContent = translation;
      }
    } else {
      console.warn(`Translation missing for key: ${key} in language: ${currentLang}`);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = getTranslation(key);
    if (translation) {
      element.setAttribute('placeholder', translation);
    } else {
      console.warn(`Placeholder translation missing for key: ${key} in language: ${currentLang}`);
    }
  });

  document.documentElement.lang = currentLang;
}

// Get translation for a key
function getTranslation(key) {
  const keys = key.split('.');
  let value = translations[currentLang] || translations['en'] || {};
  for (const k of keys) {
    value = value[k];
    if (!value) break;
  }
  return value || key;
}

// Change language programmatically
function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', currentLang);
  applyTranslations();
  console.log(`Language changed to ${lang}`);
}

// Initialize i18n
async function initI18n() {
  await loadTranslations('en'); // Load English as fallback
  await loadTranslations('ta'); // Load Tamil
  applyTranslations();

  const langToggle = document.getElementById('language-toggle');
  if (langToggle) {
    langToggle.value = currentLang;
    langToggle.addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem('language', currentLang);
      applyTranslations();
      console.log(`Language switched to ${currentLang} via dropdown`);
    });
  } else {
    console.warn('Language toggle element not found');
  }
}

// Expose translation function for dynamic use
function t(key) {
  return getTranslation(key);
}

// Expose changeLanguage for manual use
window.changeLanguage = changeLanguage;
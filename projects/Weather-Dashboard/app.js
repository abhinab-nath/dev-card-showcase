// Weather Dashboard JavaScript
// Uses OpenWeatherMap API (https://openweathermap.org/api) for weather and air quality

const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // <-- Replace with your API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const AQI_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const themeToggle = document.getElementById('theme-toggle');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');

let currentUnit = 'metric'; // 'metric' for °C, 'imperial' for °F

function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeToggle.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('weather-theme', dark ? 'dark' : 'light');
}

function loadTheme() {
    const theme = localStorage.getItem('weather-theme');
    setTheme(theme === 'dark');
}

themeToggle.addEventListener('click', () => {
    setTheme(!document.body.classList.contains('dark'));
});

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'metric') {
        currentUnit = 'metric';
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        if (window.lastCoords) fetchWeatherByCoords(window.lastCoords);
        else if (window.lastCity) fetchWeather(window.lastCity);
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'imperial') {
        currentUnit = 'imperial';
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
        if (window.lastCoords) fetchWeatherByCoords(window.lastCoords);
        else if (window.lastCity) fetchWeather(window.lastCity);
    }
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn.click();
});

geoBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            window.lastCoords = coords;
            window.lastCity = null;
            fetchWeatherByCoords(coords);
        }, err => {
            alert('Unable to get location.');
        });
    } else {
        alert('Geolocation not supported.');
    }
});

async function fetchWeather(city) {
    window.lastCity = city;
    window.lastCoords = null;
    try {
        const res = await fetch(`${BASE_URL}weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}`);
        if (!res.ok) throw new Error('City not found');
        const data = await res.json();
        const coords = { lat: data.coord.lat, lon: data.coord.lon };
        updateCurrentWeather(data);
        fetchForecast(coords);
        fetchAirQuality(coords);
    } catch (e) {
        alert('City not found.');
    }
}

async function fetchWeatherByCoords(coords) {
    try {
        const res = await fetch(`${BASE_URL}weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=${currentUnit}`);
        if (!res.ok) throw new Error('Location error');
        const data = await res.json();
        updateCurrentWeather(data);
        fetchForecast(coords);
        fetchAirQuality(coords);
    } catch (e) {
        alert('Could not fetch weather for your location.');
    }
}

function updateCurrentWeather(data) {
    document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°`;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('weather-icon').alt = data.weather[0].description;
    document.getElementById('weather-desc').textContent = data.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
}

async function fetchForecast(coords) {
    // One Call 3.0 API (requires lat/lon)
    const res = await fetch(`${BASE_URL}onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,alerts&appid=${API_KEY}&units=${currentUnit}`);
    if (!res.ok) return;
    const data = await res.json();
    updateHourlyForecast(data.hourly);
    updateDailyForecast(data.daily);
}

function updateHourlyForecast(hourly) {
    const hourlyList = document.getElementById('hourly-list');
    hourlyList.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const h = hourly[i];
        const date = new Date(h.dt * 1000);
        const hour = date.getHours();
        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `
            <div>${hour}:00</div>
            <img src="https://openweathermap.org/img/wn/${h.weather[0].icon}.png" alt="">
            <div>${Math.round(h.temp)}°</div>
        `;
        hourlyList.appendChild(card);
    }
}

function updateDailyForecast(daily) {
    const dailyList = document.getElementById('daily-list');
    dailyList.innerHTML = '';
    for (let i = 1; i < 8; i++) {
        const d = daily[i];
        const date = new Date(d.dt * 1000);
        const day = date.toLocaleDateString(undefined, { weekday: 'short' });
        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
            <div>${day}</div>
            <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" alt="">
            <div>${Math.round(d.temp.day)}°</div>
        `;
        dailyList.appendChild(card);
    }
}

async function fetchAirQuality(coords) {
    const res = await fetch(`${AQI_URL}?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`);
    if (!res.ok) return;
    const data = await res.json();
    const aqi = data.list[0].main.aqi;
    const aqiText = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi-1] || '--';
    document.getElementById('air-quality').textContent = `Air Quality: ${aqiText}`;
}

// Initial theme load
loadTheme();

// Optionally, load weather for a default city
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather('New York');
});

const recipesDiv = document.getElementById("recipes");
const title = document.getElementById("sectionTitle");

function searchRecipes() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return;

  title.textContent = "🍽️ Dishes";
  recipesDiv.innerHTML = "<p>Loading...</p>";

  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${q}`)
    .then(res => res.json())
    .then(data => {
      recipesDiv.innerHTML = "";
      if (!data.meals) {
        recipesDiv.innerHTML = "<p>No dishes found</p>";
        return;
      }
      data.meals.forEach(meal => {
        recipesDiv.appendChild(createCard(meal, true));
      });
    });
}

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

function createCard(meal, canSave) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <img src="${meal.strMealThumb}">
    <div class="content">
      <h3>${meal.strMeal}</h3>
      <div class="actions">
        <button onclick="viewRecipe('${meal.idMeal}')">View</button>
        ${canSave ? `<button onclick='saveFav(${JSON.stringify(meal)})'>❤️</button>` : ""}
      </div>
    </div>
  `;
  return div;
}

function viewRecipe(id) {
  fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
    .then(res => res.json())
    .then(data => {
      const m = data.meals[0];
      modalContent.innerHTML = `
        <div style="text-align:center;">
        <h2>${m.strMeal}</h2>
        <img src="${m.strMealThumb}" style="width:50%;height:50vh;border-radius:12px;margin:10px 0;">
        </div>
        <p><b>Category:</b> ${m.strCategory}</p>
        <p><b>Cuisine:</b> ${m.strArea}</p>
        <p style="margin-top:10px;">${m.strInstructions}</p>
      `;
      modal.style.display = "flex";
    });
}

function closeModal() {
  modal.style.display = "none";
}


function saveFav(meal) {
  let favs = JSON.parse(localStorage.getItem("favs")) || [];
  if (!favs.find(f => f.idMeal === meal.idMeal)) {
    favs.push(meal);
    localStorage.setItem("favs", JSON.stringify(favs));
  }
}

function showFavorites() {
  title.textContent = "❤️ Favorites";
  recipesDiv.innerHTML = "";

  const favs = JSON.parse(localStorage.getItem("favs")) || [];
  if (favs.length === 0) {
    recipesDiv.innerHTML = "<p>No favorites yet ❤️</p>";
    return;
  }

  favs.forEach(meal => {
    recipesDiv.appendChild(createCard(meal, false));
  });
}

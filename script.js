// حفظ آخر صفحة
let currentPage = Number(localStorage.getItem("page")) || 1;

function savePage(page){
    currentPage = page;
    localStorage.setItem("page", page);
}

function nextPage(){
    currentPage++;
    savePage(currentPage);
    loadPage();
}

function previousPage(){
    if(currentPage > 1){
        currentPage--;
        savePage(currentPage);
        loadPage();
    }
}

function loadPage(){
    const page = document.getElementById("page-number");
    if(page){
        page.textContent = currentPage;
    }
}

// الوضع الليلي
function toggleTheme(){
    document.body.classList.toggle("light");

    if(document.body.classList.contains("light")){
        localStorage.setItem("theme","light");
    }else{
        localStorage.setItem("theme","dark");
    }
}

window.onload = function(){

    loadPage();

    if(localStorage.getItem("theme") === "light"){
        document.body.classList.add("light");
    }

};

// القائمة الجانبية
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const closeMenu = document.getElementById("closeMenu");

if(menuBtn){
    menuBtn.addEventListener("click", function(){
        sidebar.classList.add("open");
    });
}

if(closeMenu){
    closeMenu.addEventListener("click", function(){
        sidebar.classList.remove("open");
    });
}

// القائمة المنسدلة للفصول
const accordion = document.querySelector(".accordion");
const submenu = document.querySelector(".submenu");

if(accordion && submenu){

    accordion.addEventListener("click", function(){

        submenu.classList.toggle("show");

    });

}

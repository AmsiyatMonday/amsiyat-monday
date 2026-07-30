// حفظ آخر صفحة
let currentPage = localStorage.getItem("page") || 1;

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

window.onload = ()=>{
    loadPage();

    if(localStorage.getItem("theme")=="light"){
        document.body.classList.add("light");
    }
};

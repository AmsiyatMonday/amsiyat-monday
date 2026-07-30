const previewBtn = document.getElementById("preview");

previewBtn.onclick = () => {

    const title = document.getElementById("title").value;
    const chapter = document.getElementById("chapter").value;
    const pdf = document.getElementById("pdf").files[0];

    if(title === ""){
        alert("اكتبي عنوان الفصل");
        return;
    }

    if(chapter === ""){
        alert("اكتبي رقم الفصل");
        return;
    }

    if(!pdf){
        alert("اختاري ملف PDF");
        return;
    }

    localStorage.setItem("previewTitle", title);
    localStorage.setItem("previewChapter", chapter);

    window.location.href = "preview.html";

};

const saveBtn = document.getElementById("save");

saveBtn.onclick = () => {

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

    alert(
`تم تجهيز الفصل.

العنوان:
${title}

رقم الفصل:
${chapter}

الملف:
${pdf.name}`
    );

};

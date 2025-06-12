const overlay = document.getElementById("overlay");
const criarproduto = document.getElementById("adicionarItem");
const titulo = document.getElementById("titulo");
const link = document.getElementById("link");
const lista = document.getElementById("lista");
const busca = document.getElementById("busca");

let db;
const request = indexedDB.open("itensDB", 1);

request.onerror = (event) => {
    console.error("Erro ao abrir o IndexedDB", event);
};

request.onsuccess = (event) => {
    db = event.target.result;
    buscarItens();
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    const store = db.createObjectStore("itens", { keyPath: "id", autoIncrement: true });
    store.createIndex("ordem", "ordem", { unique: false });
};

function novoProduto() {
    overlay.classList.add("active");
    criarproduto.classList.add("active");
}

function fecharModal() {
    overlay.classList.remove("active");
    criarproduto.classList.remove("active");
}

function addItem(event) {
    event.preventDefault();
    const tituloValor = titulo.value.trim();
    const linkValor = link.value.trim();
    if (!tituloValor) return;

    const tx = db.transaction("itens", "readwrite");
    const store = tx.objectStore("itens");

    const countRequest = store.count();
    countRequest.onsuccess = () => {
        const ordem = countRequest.result;

        const produto = { titulo: tituloValor, link: linkValor, ordem };
        store.add(produto).onsuccess = () =>
            console.log("Produto adicionado com sucesso");

        tx.oncomplete = () => {
            fecharModal();
            buscarItens();
            document.querySelector("#adicionarItem form").reset();
        };
    };
}

function buscarItens() {
    const tx = db.transaction("itens", "readonly");
    const store = tx.objectStore("itens");
    const index = store.index("ordem");
    const req = index.getAll();

    req.onsuccess = () => {
        inserirItens(req.result);
    };
}

function inserirItens(listaDeitens) {
    lista.innerHTML = "";
    listaDeitens.forEach((produto, index) => {
        const li = document.createElement("li");
        li.draggable = true;
        li.dataset.id = produto.id;
        li.dataset.ordem = produto.ordem;

        li.innerHTML = `
            <h5>${produto.titulo}</h5>
            <p>${produto.link ? `<a href="${produto.link}" target="_blank" rel="noopener noreferrer">${produto.link}</a>` : ""}</p>
            <div class="actions"><i class='bx bx-trash' onclick="deletarProduto(${produto.id})"></i></div>
        `;

        li.addEventListener("dragstart", dragStart);
        li.addEventListener("dragover", dragOver);
        li.addEventListener("drop", drop);

        lista.appendChild(li);
    });
}

let draggedElement = null;

function dragStart(event) {
    draggedElement = event.currentTarget;
    event.dataTransfer.effectAllowed = "move";
    draggedElement.classList.add("dragging");
}

function dragOver(event) {
    event.preventDefault();
    const target = event.currentTarget;
    if (target && target !== draggedElement) {
        const bounding = target.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        const after = (event.clientY > offset);
        target.parentNode.insertBefore(draggedElement, after ? target.nextSibling : target);
    }
}

function drop(event) {
    event.preventDefault();
    draggedElement.classList.remove("dragging");

    const novasOrdems = [...lista.querySelectorAll("li")].map((li, index) => ({
        id: Number(li.dataset.id),
        ordem: index
    }));

    const tx = db.transaction("itens", "readwrite");
    const store = tx.objectStore("itens");

    novasOrdems.forEach(item => {
        const req = store.get(item.id);
        req.onsuccess = () => {
            const data = req.result;
            data.ordem = item.ordem;
            store.put(data);
        };
    });

    tx.oncomplete = () => {
        buscarItens(); // renderiza com a nova ordem
    };
}

function deletarProduto(id) {
    const tx = db.transaction("itens", "readwrite");
    const store = tx.objectStore("itens");
    store.delete(id);

    tx.oncomplete = () => {
        buscarItens();
    };
}

function pesquisarItem() {
    const termo = busca.value.toLowerCase();
    const lis = document.querySelectorAll("ul li");

    lis.forEach(li => {
        const titulo = li.querySelector("h5").innerText.toLowerCase();
        const link = li.querySelector("p").innerText.toLowerCase();
        const visivel = titulo.includes(termo) || link.includes(termo);

        li.classList.toggle("oculto", !visivel);
    });
}
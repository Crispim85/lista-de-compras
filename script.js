document.addEventListener("DOMContentLoaded", () => {
    let db;
    const overlay = document.getElementById("overlay");
    const criarproduto = document.getElementById("adicionarItem");
    const titulo = document.getElementById("titulo");
    const link = document.getElementById("link");
    const lista = document.getElementById("lista");
    const busca = document.getElementById("busca");
    const request = indexedDB.open("itensDB", 2);

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

    window.novoProduto = function () {
        overlay.classList.add("active");
        criarproduto.classList.add("active");
    };

    window.fecharModal = function () {
        overlay.classList.remove("active");
        criarproduto.classList.remove("active");
    };

    window.addItem = function (event) {
        event.preventDefault();
        const tituloValor = titulo.value.trim();
        const linkValor = link.value.trim();
        if (!tituloValor || !db) return;

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
    };

    window.deletarProduto = function (id) {
        if (!db) return;
        const tx = db.transaction("itens", "readwrite");
        const store = tx.objectStore("itens");
        store.delete(id).onsuccess = () => {
            console.log("Produto deletado com sucesso");
            buscarItens();
        };
    };

    function buscarItens() {
        if (!db) return;
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
        listaDeitens.forEach((produto) => {
            const li = document.createElement("li");
            li.draggable = true;
            li.dataset.id = produto.id;
            li.dataset.ordem = produto.ordem;

            li.innerHTML = `
                <h5>${produto.titulo}</h5>
                <p>${produto.link ? `<a href="${produto.link}" target="_blank" rel="noopener noreferrer">${produto.link}</a>` : ""}</p>
                <div class="actions"><i class='bx bx-trash' onclick="deletarProduto(${produto.id})"></i></div>
            `;
            lista.appendChild(li);
        });
    }

    new Sortable(lista, {
        animation: 150,
    });
});
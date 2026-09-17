
const FIPE_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI5OGE5YjI5ZS02MjA2LTRhMmYtYTYyZi01MWU2ODA2ZWVkZDkiLCJlbWFpbCI6InBhdWxhc2FjcmFtZW50bzkzQG91dGxvb2suY29tIiwianRpIjoiZmY4MDhmNmItZGZmMS00NTU0LWIwMDMtMDczNTkzOGIyNGRlIiwiaWF0IjoxNzg5Njc0MDg4fQ.NP9lkDhUpj62K9AqyDFtxRsahnT9BC8B-m105otNmmA"; 
const FIPE_BASE_URL = "https://fipe.api.br/api/v2/cars";

const fipeHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${FIPE_API_KEY}`
};

function abrirModalMeses() { 
    document.getElementById('modalMeses').style.display = 'flex'; 
}

function fecharModalMeses() { 
    document.getElementById('modalMeses').style.display = 'none'; 
}
async function testePreco() {

    const nomeMarcaDigitada = document.getElementById('marcaInput').value;
    const nomeModeloDigitado = document.getElementById('nomeCarro').value;

    if (!nomeMarcaDigitada || !nomeModeloDigitado) {
        console.error("Preencha a marca e o modelo primeiro!");
        return;
    }

    const marcaEncontrada = marcasGlobais.find(m => m.name.toLowerCase() === nomeMarcaDigitada.toLowerCase());
    const modeloEncontrado = modelosGlobais.find(m => m.name.toLowerCase() === nomeModeloDigitado.toLowerCase());

    if (!marcaEncontrada || !modeloEncontrado) {
        console.error("Marca ou Modelo não encontrados nas listas da API.");
        return;
    }

    const marcaId = marcaEncontrada.code; 
    const modeloId = modeloEncontrado.code; 

    try {
        console.log(`Buscando anos disponíveis para o modelo: ${modeloEncontrado.name}...`);
        
        const resAnos = await fetch(`${FIPE_BASE_URL}/brands/${marcaId}/models/${modeloId}/years`, { headers: fipeHeaders });
        const anos = await resAnos.json();
        
        // Pega o código do primeiro ano da lista (geralmente o mais recente ou Zero Km)
        const anoId = anos[0].code; 
        console.log(`Ano selecionado automaticamente: ${anos[0].name} (ID: ${anoId})`);

        //Vai direto no endpoint final com os 3 IDs corretos
        const urlPreco = `${FIPE_BASE_URL}/brands/${marcaId}/models/${modeloId}/years/${anoId}`;
        
        const resposta = await fetch(urlPreco, { 
            method: "GET", 
            headers: fipeHeaders 
        });

        if (!resposta.ok) {
            console.error("Erro na requisição. Verifique sua chave de API.");
            return;
        }

        const dadosCarro = await resposta.json();

        // Exibe o resultado
        console.log("=========================================");
        console.log(`VEÍCULO: ${dadosCarro.brand} ${dadosCarro.model}`);
        console.log(`ANO: ${dadosCarro.modelYear}`);
        console.log(`PREÇO: ${dadosCarro.price}`);
        console.log("=========================================");

    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}

let marcasGlobais = [];
let modelosGlobais = [];


async function buscarMarcas() {
    try {
        const resposta = await fetch(`${FIPE_BASE_URL}/brands`, { method: "GET", headers: fipeHeaders });
        marcasGlobais = await resposta.json();
        
        const datalistMarcas = document.getElementById('listaMarcas');
        datalistMarcas.innerHTML = "";

        marcasGlobais.forEach(marca => {
            datalistMarcas.innerHTML += `<option value="${marca.name}"></option>`;
        });
    } catch (erro) {
        console.error("Erro ao carregar marcas:", erro);
    }
}


async function carregarModelosDaMarca() {
    const nomeMarcaDigitada = document.getElementById('marcaInput').value;
    const inputModelo = document.getElementById('nomeCarro');
    const datalistModelos = document.getElementById('listaModelos');

    const marcaEncontrada = marcasGlobais.find(m => m.name.toLowerCase() === nomeMarcaDigitada.toLowerCase());

    if (!marcaEncontrada) {
        inputModelo.disabled = true;
        inputModelo.placeholder = "Marca não encontrada. Tente novamente.";
        inputModelo.value = "";
        return;
    }

    inputModelo.disabled = true;
    inputModelo.placeholder = "Buscando modelos...";
    inputModelo.value = "";

    try {
        const resposta = await fetch(`${FIPE_BASE_URL}/brands/${marcaEncontrada.code}/models`, {
            method: "GET",
            headers: fipeHeaders
        });
        
        modelosGlobais = await resposta.json();
        
        datalistModelos.innerHTML = "";
        modelosGlobais.forEach(modelo => {
            datalistModelos.innerHTML += `<option value="${modelo.name}"></option>`;
        });

        inputModelo.disabled = false;
        inputModelo.placeholder = "Comece a digitar o modelo...";
        inputModelo.focus();

    } catch (erro) {
        console.error("Erro ao buscar modelos:", erro);
        inputModelo.placeholder = "Erro ao buscar modelos.";
    }
}


buscarMarcas();
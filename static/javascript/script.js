
const FIPE_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjZTFiNDgwNy1lOGRiLTRlZTEtYWU2ZS1kNzZkNzVmY2Q4MDQiLCJlbWFpbCI6Imh0dHBzLmlnb3IwMkBnbWFpbC5jb20iLCJqdGkiOiI1OWE1NDk0Mi1jYzlkLTQyYzItOGIxNS0xNTA0MWVhZjllMjMiLCJpYXQiOjE3ODk1MjA3Njl9.Vu-qXWtNObfipA5BlRDStMsgcCsRGBCA6oUjxqHWfIc"; 
const FIPE_BASE_URL = "https://fipe.api.br/api/v2/cars";

const fipeHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${FIPE_API_KEY}`
};

let dadosCarroGlobal;

async function enviarDados(dadosCarro) {
    try {
        const resposta = await fetch("http://127.0.0.1:5000/resultado", {
            method: "POST",

            headers: {"Content-Type": "application/json"},

            body: JSON.stringify(dadosCarro)
        });
           
        const dadosResposta = await resposta.text()

        document.documentElement.innerHTML = dadosResposta

        console.log("Resposta do FLASK:", dadosResposta)

    } catch(error) {
        console.error("Erro ao enviar os dados", error);
    }
}

async function abrirModalMeses() { 
    document.getElementById('modalMeses').style.display = 'flex'; 

    dadosCarroGlobal = await testePreco()

    let juros = document.getElementById("valorJuros").value
    let entrada = document.getElementById("valorEntrada").value

    dadosCarroGlobal.juros = juros;
    dadosCarroGlobal.entrada = entrada;

    console.log(dadosCarro)
}

function fecharModalMeses() {

    document.getElementById('modalMeses').style.display = 'none'; 
}

function cancelarModalMeses() { 
    document.getElementById('modalMeses').style.display = 'none'; 
}

function calcularFinanciamentoFinal() {

    let meses = Number(
        document.getElementById("quantidadeMeses").value
    );

    dadosCarroGlobal.meses = meses;

    document.getElementById("dadosCarro").value =
        JSON.stringify(dadosCarroGlobal);

    document.getElementById("formResultado").submit();
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
        // console.log("=========================================");
        // console.log(`VEÍCULO: ${dadosCarro.brand} ${dadosCarro.model}`);
        // console.log(`ANO: ${dadosCarro.modelYear}`);
        // console.log(`PREÇO: ${dadosCarro.price}`);
        // console.log("=========================================");

        // const taxaJuros = document.getElementById("valorJuros").value;
        // const entrada = document.getElementById("valorEntrada").value;

        return dadosCarro;

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

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

    console.log("1 - FUNÇÃO INICIOU");

    const jurosInput = document.getElementById("valorJuros")
    const entradaInput = document.getElementById("valorEntrada")

    const erroJuros = document.getElementById("erroJuros");
    const erroEntrada = document.getElementById("erroEntrada");

    const juros = Number(jurosInput.value);
    const entrada = Number(entradaInput.value || 0);

    jurosInput.classList.remove("input-erro");
    entradaInput.classList.remove("input-erro");

    erroJuros.classList.remove("ativo");
    erroEntrada.classList.remove("ativo");

    erroJuros.textContent = "";
    erroEntrada.textContent = "";

    console.log("2 - JUROS:", juros);
    console.log("3 - ENTRADA:", entrada);

    if (jurosInput === "" || !Number.isFinite(juros) || juros < 1) {
        jurosInput.classList.add("input-erro");
        erroJuros.textContent = "Informe uma taxa de juros de no minimo 1% ao mes";
        erroJuros.classList.add("ativo")
        return;
    }

    if (!Number.isFinite(entrada) || entrada < 0) {
        entradaInput.classList.add("input-erro");
        erroEntrada.textContent = "O valor de entrada nao pode ser negativo"
        erroJuros.classList("ativo")
        return;
    }

    console.log("4 - VOU BUSCAR CARRO");

    const carro = await testePreco();

    console.log("5 - CARRO RETORNADO:", carro);

    if (!carro) {
        console.log("CARRO NÃO RETORNOU");
        return;
    }

    console.log("6 - PRICE:", carro.price);

    const precoCarro = Number(
        carro.price
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    );

    console.log("7 - PREÇO CONVERTIDO:", precoCarro);

    if (!Number.isFinite(precoCarro)) {
        console.error("ERRO AO CONVERTER PREÇO:", carro.price);
        return;
    }

    if (entrada >= precoCarro) {
        entradaInput.classList.add("input-erro");
        erroEntrada.textContent = `A entrada deve ser menor que ${carro.price}`;
        erroEntrada.classList.add("ativo");
        return
    }

    carro.juros = juros;
    carro.entrada = entrada;

    dadosCarroGlobal = carro;

    console.log("8 - ABRINDO MODAL");

    document.getElementById("modalMeses").style.display = "flex";
}

// async function abrirModalMeses() {

//     const jurosInput = document.getElementById("valorJuros").value;
//     const entradaInput = document.getElementById("valorEntrada").value;
//     const juros = Number(jurosInput);
//     const entrada = Number(entradaInput || 0);

//     if (jurosInput === "" || !Number.isFinite(juros) || juros < 1) {
//         alert("A taxa de juros deve ser de no mínimo 1% ao mês.");
//         return;
//     }

//     if (!Number.isFinite(entrada) || entrada < 0) {
//         alert("O valor de entrada não pode ser negativo.");
//         return;
//     }

//     const carro = await testePreco();

//     if (!carro) {
//         return;
//     }

//     const precoCarro = Number(
//         carro.price
//             .replace("R$", "")
//             .replace(/\./g, "")
//             .replace(",", ".")
//             .trim()
//     );

//     if (entrada >= precoCarro) {
//         alert(
//             `A entrada deve ser menor que o valor do carro (${carro.price}).`
//         );
//         return;
//     }

//     carro.juros = juros;
//     carro.entrada = entrada;

//     dadosCarroGlobal = carro;

//     console.log("DADOS FINAIS:", dadosCarroGlobal);

//     document.getElementById("modalMeses").style.display = "flex";
// }

function fecharModalMeses() {

    document.getElementById('modalMeses').style.display = 'none'; 
}

function cancelarModalMeses() { 
    document.getElementById('modalMeses').style.display = 'none'; 
}

function calcularFinanciamentoFinal() {

    const meses = Number(
        document.getElementById("quantidadeMeses").value
    );

    dadosCarroGlobal.meses = meses;

    console.log("antes do submit:", dadosCarroGlobal);

    document.getElementById("dadosCarro").value =
        JSON.stringify(dadosCarroGlobal);

    console.log(
        "INPUT HIDDEN:",
        document.getElementById("dadosCarro").value
    );

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
        const anosReais = anos.filter(ano => {
            const numeroAno = parseInt(ano.code.split("-")[0]);

            return numeroAno !== 32000;
        });

        const anoMaisRecente = anosReais.reduce((maisRecente, atual) => {
            const anoAtual = parseInt(atual.code.split("-")[0]);
            const anoAnterior = parseInt(maisRecente.code.split("-")[0]);

            return anoAtual > anoAnterior ? atual : maisRecente;
        });
        
        const anoId = anoMaisRecente.code;

        console.log("Ano selecionado automaticamente:", anoMaisRecente);

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

        console.log("Carro final:", dadosCarro)

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

        return marcasGlobais;

    } catch (erro) {
        console.error("Erro ao carregar marcas:", erro);
        return [];
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

async function carregarStatusFipe() {
    const referenciaEl = document.getElementById("referenciaFipe")
    const consultaEl = document.getElementById("ultimaConsulta")

    if (!referenciaEl || !consultaEl) {
        return;
    }

    try {
        const marca = marcasGlobais[0];

        const respostaModelos = await fetch(
            `${FIPE_BASE_URL}/brands/${marca.code}/models`,
            { headers: fipeHeaders }
        );

        if (!respostaModelos.ok) {
            throw new Error("Erro ao consultar modelos");
        }

        const modelos = await respostaModelos.json();
        const modelo = modelos[0];

    const respostaAnos = await fetch(
        `${FIPE_BASE_URL}/brands/${marca.code}/models/${modelo.code}/years`,
        { headers: fipeHeaders }
    );

    if (!respostaAnos.ok) {
        throw new Error("Erro ao consultar anos");
    }

    const anos = await respostaAnos.json();

    const anosReais = anos.filter(ano => {
        const numeroAno = parseInt(ano.code.split("-")[0]);
        return numeroAno !== 32000;
    });

    if (!anosReais.length) {
        throw new Error("Nenhum ano encontrado");
    }

    const ano = anosReais[0];

    const respostaCarro = await fetch(
        `${FIPE_BASE_URL}/brands/${marca.code}/models/${modelo.code}/years/${ano.code}`,
        { headers: fipeHeaders } 
    );

    if (!respostaCarro.ok) {
        throw new Error("Erro ao consultar referencia FIPE");
    }

    const dadosCarro = await respostaCarro.json();

    referenciaEl.textContent =
        dadosCarro.referenceMonth || "INDISPONIVEL";

    consultaEl.textContent =
        new Date().toLocaleDateString("pt-BR");

    } catch (erro) {
        console.error("Erro ao consultar status da Fipe:", erro);

        referenciaEl.textContent = "INDISPONIVEL";
        consultaEl.textContent = "INDISPONIVEL"
    }
    
}

async function iniciarHome() {
    await buscarMarcas();
    await carregarStatusFipe();
}

iniciarHome();

